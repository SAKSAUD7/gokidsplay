from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvitationTemplateViewSet, BookingInvitationViewSet

router = DefaultRouter()
router.register(r'templates', InvitationTemplateViewSet)
router.register(r'invitations', BookingInvitationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
