"""
URL configuration for the messaging API.
"""
from django.urls import path
from . import views

app_name = 'messaging'

urlpatterns = [
    # Conversation endpoints
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/start/', views.StartConversationView.as_view(), name='conversation-start'),
    path('conversations/<uuid:conversation_id>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<uuid:conversation_id>/messages/', views.ConversationMessagesView.as_view(), name='conversation-messages'),
    path('conversations/<uuid:conversation_id>/read/', views.MarkMessagesReadView.as_view(), name='mark-read'),
    
    # Message endpoints
    path('messages/', views.SendMessageView.as_view(), name='send-message'),
    path('messages/unread-count/', views.UnreadCountView.as_view(), name='unread-count'),
]
