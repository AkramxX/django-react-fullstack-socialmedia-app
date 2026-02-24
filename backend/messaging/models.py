"""
Models for the real-time messaging system.

This module defines the Conversation and Message models that store
chat history between users.
"""
import uuid
from django.db import models
from django.db.models import Q
from base.models import MyUser


class ConversationManager(models.Manager):
    """Custom manager for Conversation model with helper methods."""
    
    def get_or_create_between(self, user1, user2):
        """
        Get or create a conversation between two users.
        
        Ensures consistent ordering of participants regardless of
        which user initiates the conversation.
        
        Args:
            user1: First MyUser instance
            user2: Second MyUser instance
            
        Returns:
            Tuple of (Conversation, created)
        """
        # Sort usernames to ensure consistent participant ordering
        if user1.username < user2.username:
            p1, p2 = user1, user2
        else:
            p1, p2 = user2, user1
            
        return self.get_or_create(
            participant_1=p1,
            participant_2=p2
        )
    
    def for_user(self, user):
        """
        Get all conversations for a user.
        
        Args:
            user: MyUser instance
            
        Returns:
            QuerySet of conversations involving this user
        """
        return self.filter(
            Q(participant_1=user) | Q(participant_2=user)
        )


class Conversation(models.Model):
    """
    Represents a chat conversation between two users.
    
    Participants are stored in alphabetical order by username to ensure
    uniqueness and consistent lookup.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participant_1 = models.ForeignKey(
        MyUser,
        on_delete=models.CASCADE,
        related_name='conversations_as_p1'
    )
    participant_2 = models.ForeignKey(
        MyUser,
        on_delete=models.CASCADE,
        related_name='conversations_as_p2'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = ConversationManager()
    
    class Meta:
        # Ensure only one conversation exists between any two users
        constraints = [
            models.UniqueConstraint(
                fields=['participant_1', 'participant_2'],
                name='unique_conversation'
            )
        ]
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['participant_1', 'updated_at']),
            models.Index(fields=['participant_2', 'updated_at']),
        ]
    
    def __str__(self):
        return f"Conversation between {self.participant_1} and {self.participant_2}"
    
    def get_other_participant(self, user):
        """Return the other participant in the conversation."""
        if self.participant_1 == user:
            return self.participant_2
        return self.participant_1
    
    def get_room_name(self):
        """
        Generate WebSocket room name for this conversation.
        
        Format: username1_username2 (alphabetically sorted)
        """
        return f"{self.participant_1.username}_{self.participant_2.username}"
    
    def get_unread_count(self, user):
        """Get count of unread messages for a user in this conversation."""
        return self.messages.filter(
            is_read=False
        ).exclude(sender=user).count()


class Message(models.Model):
    """
    Represents a single message in a conversation.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        MyUser,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['sender', 'created_at']),
            models.Index(fields=['conversation', 'is_read']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender} at {self.created_at}"
    
    def mark_as_read(self):
        """Mark this message as read."""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
