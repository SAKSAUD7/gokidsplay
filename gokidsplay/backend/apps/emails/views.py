"""
Test view to manually trigger email sending for debugging.
"""
from rest_framework.decorators import api_view, permission_classes
from apps.bookings.permissions import IsSuperAdminOnly
from rest_framework.response import Response
from rest_framework import status
from apps.bookings.models import Booking
from apps.emails.tasks import send_booking_confirmation_email
import logging

logger = logging.getLogger('apps.emails')


@api_view(['POST'])
@permission_classes([IsSuperAdminOnly])
def test_send_booking_email(request):
    """
    Test endpoint to manually trigger email for a booking.
    POST /api/v1/emails/test-booking-email/
    Body: {"booking_id": 123}
    """
    booking_id = request.data.get('booking_id')
    
    if not booking_id:
        return Response(
            {'error': 'booking_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        booking = Booking.objects.get(id=booking_id)
        logger.info(f"Test endpoint: Triggering email for booking {booking_id}")
        
        # Trigger email
        send_booking_confirmation_email(booking.id)
        
        return Response({
            'success': True,
            'message': f'Email queued for booking {booking_id}',
            'booking': {
                'id': booking.id,
                'email': booking.email,
                'name': booking.name
            }
        })
    except Booking.DoesNotExist:
        return Response(
            {'error': f'Booking {booking_id} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Test endpoint error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
