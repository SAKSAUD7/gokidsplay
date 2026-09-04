from django.urls import path
from .views import test_send_booking_email

urlpatterns = [
    path('test-booking-email/', test_send_booking_email, name='test-booking-email'),
]
