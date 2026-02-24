"""
API views for the messaging system.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    ConversationDetailSerializer,
    MessageSerializer,
    SendMessageSerializer,
)
from .permissions import can_message_user
from base.models import MyUser


class ConversationListView(APIView):
    """
    GET /api/conversations/
    
    List all conversations for the authenticated user.
    Returns conversations ordered by most recent message.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        conversations = Conversation.objects.for_user(request.user)
        serializer = ConversationSerializer(
            conversations,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)


class ConversationDetailView(APIView):
    """
    GET /api/conversations/<id>/
    
    Get details of a specific conversation including recent messages.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, conversation_id):
        conversation = get_object_or_404(
            Conversation.objects.filter(
                Q(participant_1=request.user) | Q(participant_2=request.user)
            ),
            id=conversation_id
        )
        
        serializer = ConversationDetailSerializer(
            conversation,
            context={'request': request}
        )
        return Response(serializer.data)


class ConversationMessagesView(APIView):
    """
    GET /api/conversations/<id>/messages/
    
    Get paginated messages for a conversation.
    Supports infinite scroll with ?before=<timestamp> parameter.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, conversation_id):
        # Verify user has access to this conversation
        conversation = get_object_or_404(
            Conversation.objects.filter(
                Q(participant_1=request.user) | Q(participant_2=request.user)
            ),
            id=conversation_id
        )
        
        # Get messages, with optional "before" filter for pagination
        messages = conversation.messages.all()
        
        before = request.query_params.get('before')
        if before:
            try:
                from datetime import datetime
                before_dt = datetime.fromisoformat(before.replace('Z', '+00:00'))
                messages = messages.filter(created_at__lt=before_dt)
            except (ValueError, TypeError):
                pass
        
        # Get latest 50 messages (for infinite scroll, older messages first)
        messages = messages.order_by('-created_at')[:50]
        # Reverse to chronological order
        messages = list(reversed(messages))
        
        serializer = MessageSerializer(
            messages,
            many=True,
            context={'request': request}
        )
        
        return Response({
            'messages': serializer.data,
            'has_more': conversation.messages.filter(
                created_at__lt=messages[0].created_at if messages else timezone.now()
            ).exists() if messages else False
        })


class SendMessageView(APIView):
    """
    POST /api/messages/
    
    Send a new message. Creates conversation if it doesn't exist.
    
    Request body:
    {
        "receiver_username": "string",
        "content": "string"
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        receiver_username = serializer.validated_data['receiver_username']
        content = serializer.validated_data['content']
        
        # Prevent sending message to self
        if receiver_username == request.user.username:
            return Response(
                {'error': 'Cannot send message to yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get receiver
        receiver = get_object_or_404(MyUser, username=receiver_username)
        
        # Check mutual follow permission
        can_message, reason = can_message_user(request.user, receiver)
        if not can_message:
            return Response(
                {'error': reason},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get or create conversation
        conversation, created = Conversation.objects.get_or_create_between(
            request.user,
            receiver
        )
        
        # Create message
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content
        )
        
        # Update conversation timestamp
        conversation.save()  # This updates updated_at
        
        # Return the created message
        message_serializer = MessageSerializer(
            message,
            context={'request': request}
        )
        
        return Response({
            'message': message_serializer.data,
            'conversation_id': str(conversation.id),
            'room_name': conversation.get_room_name(),
        }, status=status.HTTP_201_CREATED)


class MarkMessagesReadView(APIView):
    """
    PATCH /api/conversations/<id>/read/
    
    Mark all messages from the other user as read.
    """
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, conversation_id):
        # Verify user has access to this conversation
        conversation = get_object_or_404(
            Conversation.objects.filter(
                Q(participant_1=request.user) | Q(participant_2=request.user)
            ),
            id=conversation_id
        )
        
        # Mark unread messages from other user as read
        updated_count = conversation.messages.filter(
            is_read=False
        ).exclude(
            sender=request.user
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({
            'marked_read': updated_count
        })


class StartConversationView(APIView):
    """
    POST /api/conversations/start/
    
    Start a new conversation with a user (or get existing one).
    
    Request body:
    {
        "username": "string"
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        username = request.data.get('username')
        
        if not username:
            return Response(
                {'error': 'Username is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if username == request.user.username:
            return Response(
                {'error': 'Cannot start conversation with yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the other user
        other_user = get_object_or_404(MyUser, username=username)
        
        # Check mutual follow permission
        can_message, reason = can_message_user(request.user, other_user)
        if not can_message:
            return Response(
                {'error': reason},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get or create conversation
        conversation, created = Conversation.objects.get_or_create_between(
            request.user,
            other_user
        )
        
        serializer = ConversationDetailSerializer(
            conversation,
            context={'request': request}
        )
        
        return Response({
            'conversation': serializer.data,
            'created': created
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class UnreadCountView(APIView):
    """
    GET /api/messages/unread-count/
    
    Get total unread message count across all conversations.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        conversations = Conversation.objects.for_user(request.user)
        total_unread = sum(c.get_unread_count(request.user) for c in conversations)
        
        return Response({
            'unread_count': total_unread
        })
