from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, GlobalSettingsViewSet, DashboardViewSet, LogoViewSet, NotificationViewSet
from .search_views import global_search
from .activity_views import activity_logs, activity_stats
from .cron_views import run_scheduled_jobs

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'settings', GlobalSettingsViewSet)
router.register(r'logos', LogoViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/search/', global_search, name='global-search'),  # Global admin search
    path('activity-logs/', activity_logs, name='activity-logs'),
    path('activity-logs/stats/', activity_stats, name='activity-stats'),
    path('cron/', run_scheduled_jobs, name='scheduled-jobs'),
]

