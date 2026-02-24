"""
Serializers for the messaging API.
"""
from rest_framework import serializers
from django.utils import timezone
from .models import Conversation, Message
from base.models import MyUser


class MessageUserSerializer(serializers.ModelSerializer):
    """Minimal user serializer for message context."""
    
    class Meta:
        model = MyUser
        fields = ['username', 'first_name', 'last_name', 'profile_image']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for individual messages."""
    
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_profile_image = serializers.ImageField(source='sender.profile_image', read_only=True)
    formatted_time = serializers.SerializerMethodField()
    is_own_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id',
            'sender_username',
            'sender_profile_image',
            'content',
            'created_at',
            'formatted_time',
            'is_read',
            'read_at',
            'is_own_message',
        ]
        read_only_fields = ['id', 'created_at', 'is_read', 'read_at']
    
    def get_formatted_time(self, obj):
        """Return human-readable time format."""
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days == 0:
            return obj.created_at.strftime("%I:%M %p")
        elif diff.days == 1:
            return f"Yesterday {obj.created_at.strftime('%I:%M %p')}"
        elif diff.days < 7:
            return obj.created_at.strftime("%A %I:%M %p")
        else:
            return obj.created_at.strftime("%b %d, %Y")
    
    def get_is_own_message(self, obj):
        """Check if the message was sent by the current user."""
        request = self.context.get('request')
        if request and request.user:
            return obj.sender == request.user
        return False


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for conversations in list view."""
    
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    room_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id',
            'other_user',
            'last_message',
            'unread_count',
            'room_name',
            'updated_at',
        ]
    
    def get_other_user(self, obj):
        """Get the other participant in the conversation."""
        request = self.context.get('request')
        if request and request.user:
            other = obj.get_other_participant(request.user)
            return MessageUserSerializer(other, context=self.context).data
        return None
    
    def get_last_message(self, obj):
        """Get the most recent message in the conversation."""
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return {
                'content': last_msg.content[:50] + ('...' if len(last_msg.content) > 50 else ''),
                'sender_username': last_msg.sender.username,
                'created_at': last_msg.created_at,
                'is_read': last_msg.is_read,
            }
        return None
    
    def get_unread_count(self, obj):
        """Get count of unread messages for current user."""
        request = self.context.get('request')
        if request and request.user:
            return obj.get_unread_count(request.user)
        return 0
    
    def get_room_name(self, obj):
        """Get WebSocket room name for this conversation."""
        return obj.get_room_name()


class ConversationDetailSerializer(ConversationSerializer):
    """Extended serializer with recent messages for conversation detail view."""
    
    recent_messages = serializers.SerializerMethodField()
    
    class Meta(ConversationSerializer.Meta):
        fields = ConversationSerializer.Meta.fields + ['recent_messages']
    
    def get_recent_messages(self, obj):
        """Get the 20 most recent messages."""
        messages = obj.messages.order_by('-created_at')[:20]
        # Reverse to get chronological order
        messages = list(reversed(messages))
        return MessageSerializer(messages, many=True, context=self.context).data


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending a new message."""
    
    receiver_username = serializers.CharField(max_length=50)
    content = serializers.CharField(max_length=2000)
    
    def validate_receiver_username(self, value):
        """Validate that receiver exists."""
        try:
            MyUser.objects.get(username=value)
        except MyUser.DoesNotExist:
            raise serializers.ValidationError("User not found")
        return value
    
    def validate_content(self, value):
        """Validate message content."""
        content = value.strip()
        if not content:
            raise serializers.ValidationError("Message cannot be empty")
        return content
