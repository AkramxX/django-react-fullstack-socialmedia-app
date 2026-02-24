"""
WebSocket URL routing for the messaging app.
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Chat room between two users
    # Room name should be formatted as sorted usernames: "user1_user2"
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
]
