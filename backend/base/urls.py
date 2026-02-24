from django.contrib import admin
from django.urls import path

from django.conf import settings
from django.conf.urls.static import static
from .views import  CustomTokenObtainPairView, CostumTokenRefreshView, authenticated_view, get_user_posts, get_user_profile_data, register, toggle_follow, toggle_like, create_post, get_all_posts, search_users, update_profile, logout



urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CostumTokenRefreshView.as_view(), name='token_refresh'),
    path('user/<str:pk>/', get_user_profile_data, name='user-profile-data'),
    path('register/', register, name='register'),
    path('authenticated/', authenticated_view, name='authenticated_view'),
    path('toggle_follow/', toggle_follow, name='toggle-follow'),
    path('posts/<str:pk>/', get_user_posts, name='user-posts'),
    path('toggle_like/', toggle_like, name='toggle-like'),
    path('create_post/', create_post, name='create-post'),
    path('all_posts/', get_all_posts, name='all-posts'),
    path('search/', search_users, name='search-users'),
    path('update_profile/', update_profile, name='update-profile'),
    path('logout/', logout, name='logout'),


    
]+ static( settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
