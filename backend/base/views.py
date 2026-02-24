from django.shortcuts import render
from rest_framework.decorators import api_view , permission_classes
from rest_framework.permissions import IsAuthenticated 
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination

from .models import MyUser, Post
from .serializers import MyUserSerializer, PostSerializer, UserRegisterSerializer, UsersSerializer

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def authenticated_view(request):
    return Response({"message": "You are authenticated"}, status=status.HTTP_200_OK)

@api_view(["POST"])
def register(request):
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response (serializer.errors)

    


class CustomTokenObtainPairView(TokenObtainPairView):
   
    def post(self, request, *args, **kwargs):
        try :
            response = super().post(request, *args, **kwargs)
            tokens = response.data

            access_token = tokens['access']
            refresh_token = tokens['refresh']

            # Get the user data to return to the frontend
            username = request.data.get('username')
            user = MyUser.objects.get(username=username)

            res = Response()

            res.set_cookie(
                key = 'access_token',
                value = access_token,
                httponly= True,
                secure = True,
                samesite = 'None',
                path = '/'
            ) 
            res.set_cookie(
                key = 'refresh_token',
                value = refresh_token,
                httponly= True,
                secure = True,
                samesite = 'None',
                path = '/'
            )
            res.data = { 
                "success": True,
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "bio": user.bio,
                }
            }
            return res
        except:
            return Response({ "success": False}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class CostumTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        try :
            refresh_token = request.COOKIES.get('refresh_token')
            request.data['refresh'] = refresh_token

            response = super().post(request, *args, **kwargs)
            tokens = response.data

            access_token = tokens['access']

            res = Response()
            res.data = { "success": True}

            res.set_cookie(
                key = 'access_token',
                value = access_token,
                httponly= True,
                secure = True,
                samesite = 'None',
                path = '/'
            ) 
            return res
        except:
            return Response({ "success": False}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile_data (request,pk):

    try:
        user =MyUser.objects.get(username=pk)
    except MyUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    following = False

    if request.user in user.followers.all():
        following = True

    serializer = MyUserSerializer(user, many=False, context={'request': request})
    return Response({**serializer.data, 'is_our_profile': user.username == request.user.username, 'following': following})
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_follow(request):
    try:
        try:
            my_user =MyUser.objects.get(username=request.user.username)
            user_requesting = MyUser.objects.get(username=request.data["username"])
        except MyUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if my_user in user_requesting.followers.all():
            user_requesting.followers.remove(my_user)
            return Response({'now_following': False})

        else:
            user_requesting.followers.add(my_user)
            return Response({'now_following': True})
    except:
        return Response({'error': 'error following user'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_posts(request, pk):

    try:
        user =MyUser.objects.get(username=pk)
        requesting_user = MyUser.objects.get(username=request.user.username)
    except MyUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    posts = user.posts.all().order_by('-created_at')
    serializer = PostSerializer(posts, many=True)

    data = []
    
    for post in serializer.data:
        new_post ={}
        liked = False

        if requesting_user.username in post['likes']:
            liked = True

        new_post = { **post, 'liked': liked}
        data.append(new_post)
   
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_like(request):
    try:    
        try:
            post = Post.objects.get(id = request.data['id'])
        except Post.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        
        try: 
            user = MyUser.objects.get(username=request.user.username)
        except MyUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if user in post.likes.all():
            post.likes.remove(user)
            return Response({'now_liked': False})
        else:
            post.likes.add(user)
            return Response({'now_liked': True})
    except:
        return Response({'error': 'error liking post'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    try:    
        try:
            user = MyUser.objects.get(username=request.user.username)
        except MyUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        post=Post.objects.create(
            user=user,
            description = request.data['description']
        )
        serializer = PostSerializer(post, many=False)
        return Response(serializer.data)
    except:
        return Response({'error': 'error creating post'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_posts(request):
    try:
        requesting_user = MyUser.objects.get(username=request.user.username)
    except MyUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    posts = Post.objects.all().order_by('-created_at')

    paginator = PageNumberPagination()
    paginator.page_size = 10
    result_page = paginator.paginate_queryset(posts, request)

    serializer = PostSerializer(result_page, many=True)
    data=[]

    for post in serializer.data:
        new_post ={}
        liked = False

        if requesting_user.username in post['likes']:
            liked = True

        new_post = { **post, 'liked': liked}
        data.append(new_post)
    return paginator.get_paginated_response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    query = request.query_params.get('query', '')
    users = MyUser.objects.filter(username__icontains=query) | MyUser.objects.filter(first_name__icontains=query) | MyUser.objects.filter(last_name__icontains=query)
    serializer = UsersSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    data = request.data
    try:
        user = MyUser.objects.get(username=request.user.username)
    except MyUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer= UsersSerializer(user,data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({**serializer.data, "success": True})
    
    return Response({**serializer.errors, "success": False}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        res = Response()
        res.delete_cookie('access_token', path='/', samesite="None")
        res.delete_cookie('refresh_token', path='/', samesite="None")
        res.data = { "success": True}
        return res 
    except:
        return Response({ "success": False}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)