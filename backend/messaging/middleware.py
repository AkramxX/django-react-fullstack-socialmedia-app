"""
Custom JWT authentication middleware for WebSocket connections.

This middleware extracts and validates JWT tokens from WebSocket connections,
either from cookies or query parameters, and attaches the authenticated user
to the connection scope.
"""
import logging
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from base.models import MyUser

logger = logging.getLogger(__name__)


@database_sync_to_async
def get_user_from_token(token_key):
    """
    Validate JWT token and return the associated user.
    
    Args:
        token_key: The JWT access token string
        
    Returns:
        MyUser instance if valid, AnonymousUser otherwise
    """
    try:
        # Decode and validate the token
        access_token = AccessToken(token_key)
        
        # Get user ID from token (configured as 'username' in SIMPLE_JWT settings)
        user_id = access_token.get('user_id')
        logger.debug(f"Token decoded, user_id from token: {user_id}")
        
        if user_id:
            user = MyUser.objects.get(username=user_id)
            logger.debug(f"User found: {user.username}")
            return user
        return AnonymousUser()
        
    except (InvalidToken, TokenError, MyUser.DoesNotExist) as e:
        logger.warning(f"Token validation failed: {e}")
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware that authenticates WebSocket connections using JWT.
    
    Token can be provided via:
    1. Cookie named 'access' (preferred - matches REST API auth)
    2. Query parameter 'token' (fallback for clients that can't set cookies)
    
    Usage in ASGI:
        JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
    """
    
    async def __call__(self, scope, receive, send):
        # Initialize user as anonymous
        scope['user'] = AnonymousUser()
        
        # Try to get token from cookies first (set by frontend auth)
        cookies = self._parse_cookies(scope.get('headers', []))
        token = cookies.get('access_token')  # Match frontend cookie name
        
        logger.debug(f"WebSocket connection - Cookies found: {list(cookies.keys())}")
        logger.debug(f"Access token from cookie: {'Found' if token else 'Not found'}")
        
        # Fallback to query parameter if no cookie
        if not token:
            token = self._get_token_from_query(scope)
            if token:
                logger.debug("Token found in query parameter")
        
        # Authenticate if we have a token
        if token:
            scope['user'] = await get_user_from_token(token)
            logger.info(f"WebSocket auth result: {scope['user']}")
        else:
            logger.warning("No token found in cookies or query params")
        
        return await super().__call__(scope, receive, send)
    
    def _parse_cookies(self, headers):
        """
        Parse cookies from WebSocket headers.
        
        Args:
            headers: List of header tuples from scope
            
        Returns:
            Dictionary of cookie name -> value
        """
        cookies = {}
        for header_name, header_value in headers:
            if header_name == b'cookie':
                cookie_string = header_value.decode('utf-8')
                for item in cookie_string.split(';'):
                    item = item.strip()
                    if '=' in item:
                        key, value = item.split('=', 1)
                        cookies[key.strip()] = value.strip()
        return cookies
    
    def _get_token_from_query(self, scope):
        """
        Extract token from query string parameters.
        
        Args:
            scope: WebSocket connection scope
            
        Returns:
            Token string or None
        """
        query_string = scope.get('query_string', b'').decode('utf-8')
        params = dict(
            item.split('=') for item in query_string.split('&') 
            if '=' in item
        )
        return params.get('token')
