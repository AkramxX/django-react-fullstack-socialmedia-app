"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator, OriginValidator
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# Import after Django setup to avoid AppRegistryNotReady
from messaging.routing import websocket_urlpatterns
from messaging.middleware import JWTAuthMiddleware

# Build WebSocket application with JWT auth
websocket_application = JWTAuthMiddleware(
    URLRouter(websocket_urlpatterns)
)

# In development, allow all origins; in production, restrict to ALLOWED_HOSTS
if settings.DEBUG:
    # Development: Use OriginValidator with explicit allowed origins
    websocket_application = OriginValidator(
        websocket_application,
        ["http://localhost:5173", "http://127.0.0.1:5173"]
    )
else:
    # Production: Use ALLOWED_HOSTS for origin validation
    websocket_application = AllowedHostsOriginValidator(websocket_application)

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": websocket_application,
})
