"""
Test view to manually trigger email sending for debugging.
"""
from rest_framework.decorators import api_view, permission_classes
from apps.bookings.permissions import IsStaffUser, IsSuperAdminOnly
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


def resend_booking_confirmation(booking, kind: str) -> Response:
    """Send the confirmation e-mail for a session or party booking again (staff action)."""
    from apps.emails.models import EmailLog
    from apps.emails.services import email_service
    from apps.emails.tasks import send_email_async

    send = email_service.send_party_booking_confirmation if kind == 'party' else email_service.send_booking_confirmation
    email_log = send(booking)
    if email_log.status == 'PENDING':
        send_email_async(email_log.id)
    email_log = EmailLog.objects.get(pk=email_log.pk)
    if email_log.status == 'SENT':
        return Response({'success': True, 'message': f'Confirmation e-mail sent to {booking.email}'})
    return Response({'success': False, 'error': email_log.error_message or 'The e-mail could not be sent'},
                    status=status.HTTP_502_BAD_GATEWAY)


@api_view(['POST'])
@permission_classes([IsStaffUser])
def resend_confirmation_email(request):
    """
    Staff: send the booking confirmation e-mail again.
    POST /api/v1/emails/resend-confirmation/  {"type": "session" | "party", "id": 123}
    """
    from apps.bookings.models import PartyBooking
    kind = request.data.get('type', 'session')
    model = PartyBooking if kind == 'party' else Booking
    try:
        booking = model.objects.get(pk=request.data.get('id'))
    except (model.DoesNotExist, ValueError, TypeError):
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
    return resend_booking_confirmation(booking, kind)
