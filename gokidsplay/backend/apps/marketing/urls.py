from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import unsubscribe_view, EmailTemplateViewSet, MarketingCampaignViewSet, email_tracking_pixel, email_click_redirect

router = DefaultRouter()
router.register(r'email-templates', EmailTemplateViewSet)
router.register(r'marketing-campaigns', MarketingCampaignViewSet)

urlpatterns = [
    path('unsubscribe/', unsubscribe_view, name='marketing_unsubscribe'),
    path('track/pixel/<uuid:tracking_id>/', email_tracking_pixel, name='email_tracking_pixel'),
    path('track/click/<uuid:tracking_id>/', email_click_redirect, name='email_click_redirect'),
    path('', include(router.urls)),
]
