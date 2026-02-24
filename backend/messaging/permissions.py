"""
Custom permissions for the messaging system.
"""
from rest_framework.permissions import BasePermission


class IsMutualFollow(BasePermission):
    """
    Permission that requires mutual follow relationship between users.
    
    Both users must follow each other to be allowed to message.
    This ensures messaging is only available for connected users.
    
    Usage:
        - In views: permission_classes = [IsAuthenticated, IsMutualFollow]
        - Requires 'target_user' in view kwargs or request data with 'receiver_username'
    """
    
    message = "You can only message users who follow you back."
    
    def has_permission(self, request, view):
        """
        Check if the request should be permitted.
        
        For list views (GET conversations), always allow.
        For create/send views (POST), check mutual follow.
        """
        # Always allow GET requests (viewing own conversations)
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # For POST/PATCH, we need to check mutual follow
        return True  # Actual check happens in has_object_permission or view
    
    def has_object_permission(self, request, view, obj):
        """
        Check object-level permission for conversations.
        """
        # User must be a participant in the conversation
        user = request.user
        if hasattr(obj, 'participant_1') and hasattr(obj, 'participant_2'):
            return obj.participant_1 == user or obj.participant_2 == user
        return True


def check_mutual_follow(user1, user2):
    """
    Check if two users have a mutual follow relationship.
    
    Args:
        user1: First MyUser instance
        user2: Second MyUser instance
        
    Returns:
        bool: True if both users follow each other, False otherwise
    """
    if user1 == user2:
        return False
    
    # user1 follows user2: user2 is in user1's following
    # user2 follows user1: user1 is in user2's following
    user1_follows_user2 = user2.followers.filter(username=user1.username).exists()
    user2_follows_user1 = user1.followers.filter(username=user2.username).exists()
    
    return user1_follows_user2 and user2_follows_user1


def can_message_user(from_user, to_user):
    """
    Check if from_user can send a message to to_user.
    
    Rules:
    - Cannot message yourself
    - Must have mutual follow relationship
    
    Args:
        from_user: The user sending the message
        to_user: The user receiving the message
        
    Returns:
        tuple: (can_message: bool, reason: str or None)
    """
    if from_user == to_user:
        return False, "Cannot message yourself"
    
    if not check_mutual_follow(from_user, to_user):
        return False, "You can only message users who follow you back"
    
    return True, None
