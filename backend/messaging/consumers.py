"""
WebSocket consumers for real-time messaging.

This module contains the ChatConsumer class that handles WebSocket
connections for real-time chat between users.
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time chat messages.
    
    Handles:
    - Connection authentication and authorization
    - Joining chat rooms (groups)
    - Receiving and broadcasting messages
    - Typing indicators
    - Read receipts
    - Disconnection cleanup
    """
    
    async def connect(self):
        """
        Handle WebSocket connection.
        
        1. Authenticate user from scope (set by JWTAuthMiddleware)
        2. Extract room name from URL
        3. Verify user has permission to join room
        4. Add channel to room group
        5. Accept connection
        """
        self.user = self.scope.get('user', AnonymousUser())
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        
        logger.info(f"WebSocket connect attempt - room: {self.room_name}, user: {self.user}")
        
        # Reject connection if user is not authenticated
        if isinstance(self.user, AnonymousUser) or not self.user.is_authenticated:
            logger.warning(f"WebSocket auth rejected - user is AnonymousUser or not authenticated")
            await self.close(code=4001)  # Custom code for auth failure
            return
        
        # Verify user is allowed in this room
        # Room name format: "username1_username2" (sorted alphabetically)
        can_join = await self._can_join_room()
        logger.info(f"Can join room check: {can_join}")
        if not can_join:
            logger.warning(f"Permission denied for {self.user.username} to join room {self.room_name}")
            await self.close(code=4003)  # Custom code for permission denied
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"WebSocket connected - {self.user.username} joined {self.room_name}")
        
        # Notify room that user joined (optional)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_joined',
                'username': self.user.username,
            }
        )
    
    async def disconnect(self, close_code):
        """
        Handle WebSocket disconnection.
        
        Remove channel from room group and notify other users.
        """
        if hasattr(self, 'room_group_name'):
            # Notify room that user left
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_left',
                    'username': getattr(self.user, 'username', 'Unknown'),
                }
            )
            
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """
        Handle incoming WebSocket messages.
        
        Message types:
        - chat_message: Regular chat message
        - typing_start: User started typing
        - typing_stop: User stopped typing
        - mark_read: Mark messages as read
        """
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
            return
        
        message_type = data.get('type', 'chat_message')
        
        if message_type == 'chat_message':
            await self._handle_chat_message(data)
        elif message_type == 'typing_start':
            await self._handle_typing_start()
        elif message_type == 'typing_stop':
            await self._handle_typing_stop()
        elif message_type == 'mark_read':
            await self._handle_mark_read(data)
        else:
            await self.send_error(f"Unknown message type: {message_type}")
    
    async def _handle_chat_message(self, data):
        """Process and broadcast a chat message."""
        content = data.get('content', '').strip()
        
        if not content:
            await self.send_error("Message content cannot be empty")
            return
        
        if len(content) > 2000:
            await self.send_error("Message too long (max 2000 characters)")
            return
        
        # Save message to database (will be implemented in Phase 10)
        # message = await self._save_message(content)
        
        # Broadcast message to room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'content': content,
                'sender': self.user.username,
                'timestamp': self._get_timestamp(),
                # 'message_id': str(message.id),  # Uncomment when model is ready
            }
        )
    
    async def _handle_typing_start(self):
        """Broadcast typing indicator to room."""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'username': self.user.username,
                'is_typing': True,
            }
        )
    
    async def _handle_typing_stop(self):
        """Broadcast typing stopped to room."""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'username': self.user.username,
                'is_typing': False,
            }
        )
    
    async def _handle_mark_read(self, data):
        """Mark messages as read and notify sender."""
        # Will be implemented when Message model is ready (Phase 10)
        message_ids = data.get('message_ids', [])
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'read_receipt',
                'reader': self.user.username,
                'message_ids': message_ids,
            }
        )
    
    # ==================== Event Handlers ====================
    # These methods handle messages broadcast to the room group
    
    async def chat_message(self, event):
        """Send chat message to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'content': event['content'],
            'sender': event['sender'],
            'timestamp': event['timestamp'],
            'message_id': event.get('message_id'),
        }))
    
    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket."""
        # Don't send typing indicator to the user who is typing
        if event['username'] != self.user.username:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'username': event['username'],
                'is_typing': event['is_typing'],
            }))
    
    async def read_receipt(self, event):
        """Send read receipt to WebSocket."""
        # Only send to users who didn't trigger the read
        if event['reader'] != self.user.username:
            await self.send(text_data=json.dumps({
                'type': 'read_receipt',
                'reader': event['reader'],
                'message_ids': event['message_ids'],
            }))
    
    async def user_joined(self, event):
        """Send user joined notification."""
        if event['username'] != self.user.username:
            await self.send(text_data=json.dumps({
                'type': 'user_joined',
                'username': event['username'],
            }))
    
    async def user_left(self, event):
        """Send user left notification."""
        if event['username'] != self.user.username:
            await self.send(text_data=json.dumps({
                'type': 'user_left',
                'username': event['username'],
            }))
    
    # ==================== Helper Methods ====================
    
    async def _can_join_room(self):
        """
        Check if user is allowed to join the room.
        
        Room name format: "username1_username2" (sorted alphabetically)
        User must be one of the participants AND have mutual follow.
        """
        participants = self.room_name.split('_')
        
        # User must be a participant
        if self.user.username not in participants:
            return False
        
        # Get the other participant's username
        other_username = participants[0] if participants[1] == self.user.username else participants[1]
        
        # Check mutual follow relationship
        has_mutual_follow = await self._check_mutual_follow(other_username)
        return has_mutual_follow
    
    @database_sync_to_async
    def _check_mutual_follow(self, other_username):
        """
        Check if current user and other user have mutual follow.
        
        Args:
            other_username: Username of the other participant
            
        Returns:
            bool: True if mutual follow exists
        """
        from .permissions import check_mutual_follow
        from base.models import MyUser
        
        try:
            other_user = MyUser.objects.get(username=other_username)
            return check_mutual_follow(self.user, other_user)
        except MyUser.DoesNotExist:
            return False
    
    def _get_timestamp(self):
        """Get current timestamp as ISO format string."""
        from datetime import datetime
        return datetime.utcnow().isoformat() + 'Z'
    
    async def send_error(self, message):
        """Send error message to client."""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message,
        }))
