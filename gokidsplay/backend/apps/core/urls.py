from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, GlobalSettingsViewSet, DashboardViewSet, LogoViewSet, NotificationViewSet
from .search_views import global_search

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'settings', GlobalSettingsViewSet)
router.register(r'logos', LogoViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/search/', global_search, name='global-search'),  # Global admin search
]

