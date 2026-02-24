from rest_framework import serializers
from .models import *



class UserRegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)

    class Meta:
        model = MyUser
        fields = ['username', 'email', 'first_name', 'last_name', 'password']

    def create(self, validated_data):
        user = MyUser(
            username = validated_data['username'],
            email = validated_data['email'],
            first_name = validated_data['first_name'],
            last_name= validated_data['last_name'],
        )

        user.set_password(validated_data['password'])
        user.save()
        return user

class MyUserSerializer(serializers.ModelSerializer):

    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    can_message = serializers.SerializerMethodField()


    class Meta:
        model = MyUser
        fields = ['username', 'bio', 'profile_image', 'followers_count', 'following_count', 'can_message']

    def get_followers_count(self, obj):
        return obj.followers.count()
    
    def get_following_count(self, obj):
        return obj.following.count()
    
    def get_can_message(self, obj):
        """
        Check if the authenticated user can message this user.
        
        Returns True only if there's a mutual follow relationship.
        Returns False if viewing own profile or not authenticated.
        """
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        
        # Can't message yourself
        if request.user == obj:
            return False
        
        # Check mutual follow
        from messaging.permissions import check_mutual_follow
        return check_mutual_follow(request.user, obj)
    
class PostSerializer(serializers.ModelSerializer):

    username = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    formatted_date = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'username', 'description', 'formatted_date', 'likes', 'like_count']

    def get_username(self, obj):
        return obj.user.username
    
    def get_like_count(self, obj):
        return obj.likes.count()
    
    def get_formatted_date(self, obj):
        return obj.created_at.strftime(" %d %b %y")

class UsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyUser
        fields = ['first_name', 'last_name', 'username', 'profile_image', 'bio', 'email']