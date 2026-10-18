from django.urls import path
from .views import resend_confirmation_email, test_send_booking_email

urlpatterns = [
    path('test-booking-email/', test_send_booking_email, name='test-booking-email'),
    path('resend-confirmation/', resend_confirmation_email, name='resend-confirmation'),
]
