"""
Special Events API Views — Section 7: Events / Special Parties
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Sum, Count
from .references import normalise_reference
from .models import SpecialEvent, EventBooking, EventRequest, Customer
from .serializers import SpecialEventSerializer, EventBookingSerializer, EventRequestSerializer
from .permissions import IsStaffUser, IsSuperAdminOnly
import logging
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


class SpecialEventViewSet(viewsets.ModelViewSet):
    """
    Admin API for managing Special Events (Birthday, Christmas, Halloween etc.)
    """
    serializer_class = SpecialEventSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        qs = SpecialEvent.objects.all()
        # Filtering
        status_filter = self.request.query_params.get('status')
        event_type = self.request.query_params.get('event_type')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        search = self.request.query_params.get('search')

        if status_filter:
            qs = qs.filter(status=status_filter)
        if event_type:
            qs = qs.filter(event_type=event_type)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))

        return qs.order_by('date', 'start_time')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        """Publish an event (make it visible to public)."""
        event = self.get_object()
        event.status = 'PUBLISHED'
        event.save()
        return Response({'success': True, 'status': event.status})

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """Cancel an event."""
        event = self.get_object()
        reason = str(request.data.get('reason', '') or '')[:500]
        event.status = 'CANCELLED'
        event.save()

        # Cancel every reservation still holding a place and tell the customer
        active = list(EventBooking.objects.filter(event=event)
                      .exclude(status__in=EventBooking.RELEASED_STATUSES + ('COMPLETED', 'NO_SHOW')))
        from django.conf import settings as dj_settings
        from apps.emails.services import EmailService
        emailed = 0
        for booking in active:
            booking.status = 'CANCELLED'
            booking.save()
            try:
                EmailService().send_email(
                    email_type='BOOKING_CANCELLED',
                    recipient_email=booking.email,
                    recipient_name=booking.name,
                    subject=f'{event.title} has been cancelled',
                    context={
                        'customer_name': booking.name,
                        'booking_reference': booking.booking_reference,
                        'event_title': event.title,
                        'event_date': event.date.strftime('%A %d %B %Y'),
                        'reason': reason,
                        'amount_paid': float(booking.amount_paid or 0),
                        'emoji': event.emoji or '📅',
                        'site_url': getattr(dj_settings, 'FRONTEND_URL', '').rstrip('/'),
                    },
                    template_name='emails/booking/event_cancelled.html',
                )
                emailed += 1
            except Exception as email_err:
                logger.warning(f"Event cancellation email failed for {booking.booking_reference}: {email_err}")
        paid = sum(1 for b in active if (b.amount_paid or 0) > 0)
        logger.info(f"Event {event.id} cancelled by {request.user.email}: {len(active)} bookings cancelled. Reason: {reason}")
        return Response({'success': True, 'status': event.status, 'bookings_cancelled': len(active),
                         'customers_emailed': emailed, 'bookings_to_refund': paid})

    @action(detail=True, methods=['post'], url_path='duplicate')
    def duplicate(self, request, pk=None):
        """Duplicate an event to a new date."""
        event = self.get_object()
        new_date = request.data.get('date')
        if not new_date:
            return Response({'error': 'date is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Clone
        import uuid as uuid_lib
        event.pk = None
        event.uuid = uuid_lib.uuid4()
        event.slug = ''
        event.date = new_date
        event.status = 'DRAFT'
        event.reserved_spots = 0
        event.save()
        serializer = self.get_serializer(event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='bookings')
    def bookings(self, request, pk=None):
        """Get all bookings for this event."""
        event = self.get_object()
        event_bookings = EventBooking.objects.filter(event=event).select_related('customer')
        serializer = EventBookingSerializer(event_bookings, many=True)
        return Response({
            'event': self.get_serializer(event).data,
            'bookings': serializer.data,
            'total': event_bookings.count(),
            'confirmed': event_bookings.filter(status='CONFIRMED').count(),
            'cancelled': event_bookings.filter(status='CANCELLED').count(),
        })

    @action(detail=True, methods=['get'], url_path='stats')
    def stats(self, request, pk=None):
        event = self.get_object()
        bookings = EventBooking.objects.filter(event=event)
        total_revenue = bookings.filter(status__in=['CONFIRMED', 'COMPLETED']).aggregate(
            total=Sum('amount_paid')
        )['total'] or 0
        return Response({
            'total_capacity': event.total_capacity,
            'reserved_spots': event.reserved_spots,
            'available_spots': event.available_spots,
            'is_sold_out': event.is_sold_out,
            'confirmed_bookings': bookings.filter(status='CONFIRMED').count(),
            'pending_bookings': bookings.filter(status='PENDING').count(),
            'cancelled_bookings': bookings.filter(status='CANCELLED').count(),
            'total_revenue_gbp': float(total_revenue),
        })


class EventBookingViewSet(viewsets.ModelViewSet):
    """
    Admin API for managing bookings made on Special Events.
    """
    serializer_class = EventBookingSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        qs = EventBooking.objects.select_related('event', 'customer').all()
        event_id = self.request.query_params.get('event_id')
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        if event_id:
            qs = qs.filter(event_id=event_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(email__icontains=search) | Q(phone__icontains=search)
                           | Q(booking_reference__icontains=normalise_reference(search)))
        return qs.order_by('-created_at')

    def _reply(self, booking):
        return Response(self.get_serializer(booking).data)

    @action(detail=True, methods=['post'], url_path='mark-paid')
    def mark_paid(self, request, pk=None):
        """Payment taken at the venue (cash or card on the day)."""
        booking = self.get_object()
        booking.status = 'CONFIRMED' if booking.status in ('PENDING',) else booking.status
        booking.payment_status = 'FULLY_PAID'
        booking.amount_paid = booking.subtotal
        booking.balance_due = 0
        booking.save()
        return self._reply(booking)

    @action(detail=True, methods=['post'], url_path='mark-unpaid')
    def mark_unpaid(self, request, pk=None):
        booking = self.get_object()
        booking.payment_status = 'PENDING'
        booking.amount_paid = 0
        booking.balance_due = booking.subtotal
        booking.save()
        return self._reply(booking)

    # Kept for older admin screens: confirming a reservation = paid at the venue
    @action(detail=True, methods=['post'], url_path='confirm')
    def confirm(self, request, pk=None):
        return self.mark_paid(request, pk)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        booking = self.get_object()
        booking.status = 'CANCELLED'
        booking.save()
        return self._reply(booking)

    @action(detail=True, methods=['post'], url_path='reinstate')
    def reinstate(self, request, pk=None):
        """Undo a cancellation, if the event still has room."""
        booking = self.get_object()
        if booking.status in EventBooking.RELEASED_STATUSES:
            needed = booking.num_children + booking.num_adults
            if needed > booking.event.available_spots:
                return Response({'error': f'Only {booking.event.available_spots} places left at this event.'},
                                status=status.HTTP_400_BAD_REQUEST)
            booking.status = 'CONFIRMED'
            booking.save()
        return self._reply(booking)

    @action(detail=True, methods=['post'], url_path='mark-arrived')
    def mark_arrived(self, request, pk=None):
        booking = self.get_object()
        booking.arrived = True
        booking.arrived_at = timezone.now()
        if booking.status == 'NO_SHOW':
            booking.status = 'CONFIRMED'
        booking.save()
        return self._reply(booking)

    @action(detail=True, methods=['post'], url_path='mark-no-show')
    def mark_no_show(self, request, pk=None):
        booking = self.get_object()
        booking.arrived = False
        booking.arrived_at = None
        booking.status = 'NO_SHOW'
        booking.save()
        return self._reply(booking)


class EventRequestViewSet(viewsets.ModelViewSet):
    """Admin API for customers' requests to organise an event."""
    serializer_class = EventRequestSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        qs = EventRequest.objects.select_related('event').all()
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(email__icontains=search)
                           | Q(reference__icontains=normalise_reference(search)) | Q(phone__icontains=search))
        return qs.order_by('-created_at')


# ─── Public API ───────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_events_list(request):
    """Public endpoint — returns all published, upcoming events."""
    today = timezone.now().date()
    events = SpecialEvent.objects.filter(
        status='PUBLISHED',
        is_public=True,
        date__gte=today
    ).order_by('date', 'start_time')

    event_type = request.query_params.get('event_type')
    if event_type:
        events = events.filter(event_type=event_type)

    serializer = SpecialEventSerializer(events, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_event_detail(request, slug):
    """Public endpoint — returns a single published event by slug."""
    try:
        event = SpecialEvent.objects.get(slug=slug, status='PUBLISHED', is_public=True)
    except SpecialEvent.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = SpecialEventSerializer(event)
    return Response(serializer.data)


def _clean_contact(data):
    """Name, email and phone from a public form, or an error message."""
    import re
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    phone = (data.get('phone') or '').strip()
    if len(name) < 2:
        return None, 'Please enter your name.'
    if not re.match(r'^[^@\s]+@[^@\s]+\.[a-z]{2,}$', email, re.I):
        return None, 'Please enter a valid email address.'
    if len(re.sub(r'\D', '', phone)) < 7:
        return None, 'Please enter a valid phone number.'
    return {'name': name[:255], 'email': email, 'phone': phone[:50]}, None


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def create_event_booking(request):
    """
    Public endpoint — customers reserve places at a Special Event.
    Payment is taken at the venue, so a reservation is confirmed straight away
    with the full amount due on the day.
    """
    from django.db import transaction
    data = request.data

    contact, contact_error = _clean_contact(data)
    if contact_error:
        return Response({'error': contact_error}, status=status.HTTP_400_BAD_REQUEST)

    try:
        num_children = int(data.get('num_children') or 0)
        num_adults = int(data.get('num_adults') or 0)
    except (TypeError, ValueError):
        return Response({'error': 'Attendee numbers must be whole numbers'}, status=status.HTTP_400_BAD_REQUEST)
    if num_children < 0 or num_adults < 0:
        return Response({'error': 'Attendee numbers cannot be negative'}, status=status.HTTP_400_BAD_REQUEST)
    total_attendees = num_children + num_adults
    if total_attendees == 0:
        return Response({'error': 'At least one attendee is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            # Lock the event row so two people can't take the last places at once
            try:
                event = SpecialEvent.objects.select_for_update().get(
                    id=data.get('event_id'), status='PUBLISHED', is_public=True)
            except (SpecialEvent.DoesNotExist, ValueError, TypeError):
                return Response({'error': 'Event not found or not available'}, status=status.HTTP_404_NOT_FOUND)

            if event.date < timezone.localdate():
                return Response({'error': 'This event has already taken place.'}, status=status.HTTP_400_BAD_REQUEST)
            if total_attendees > event.available_spots:
                return Response({
                    'error': f'Not enough places left. Only {event.available_spots} available.'
                }, status=status.HTTP_400_BAD_REQUEST)

            subtotal = (num_children * event.price_per_child) + (num_adults * event.price_per_adult)
            customer = Customer.objects.filter(email__iexact=contact['email']).first()
            booking = EventBooking.objects.create(
                event=event,
                customer=customer,
                num_children=num_children,
                num_adults=num_adults,
                special_requirements=(data.get('special_requirements') or '')[:2000],
                price_per_child=event.price_per_child,
                price_per_adult=event.price_per_adult,
                subtotal=subtotal,
                deposit_amount=0,
                amount_paid=0,
                balance_due=subtotal,
                status='CONFIRMED',          # place reserved
                payment_status='PENDING',    # paid at the venue
                ip_address=request.META.get('REMOTE_ADDR'),
                **contact,
            )
    except Exception as e:
        logger.error(f"Event booking creation failed: {e}", exc_info=True)
        return Response({'error': 'Sorry, we could not save your reservation. Please try again.'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ── Confirmation email (sent only when email is enabled) ──────────────────
    try:
        from apps.emails.services import EmailService
        EmailService().send_email(
            email_type='BOOKING_CONFIRMATION',
            recipient_email=booking.email,
            recipient_name=booking.name,
            subject=f'Your places at {event.title} are reserved {event.emoji}',
            context={
                'customer_name': booking.name,
                'booking_reference': booking.booking_reference,
                'event_title': event.title,
                'event_date': event.date.strftime('%A %d %B %Y'),
                'event_time': f"{event.start_time.strftime('%H:%M')} – {event.end_time.strftime('%H:%M')}",
                'num_children': booking.num_children,
                'num_adults': booking.num_adults,
                'subtotal': float(subtotal),
                'deposit_amount': None,
                'is_free': event.is_free,
                'accent_color': event.accent_color or '#8B5CF6',
                'emoji': event.emoji or '🎉',
                'special_instructions': event.special_instructions,
            },
            template_name='emails/booking/event_confirmation.html',
        )
    except Exception as email_err:
        logger.warning(f"Event booking confirmation email failed: {email_err}")
    try:
        from apps.emails.notifications import event_reserved
        event_reserved(booking)
    except Exception as email_err:
        logger.warning(f"Event reservation team notice failed: {email_err}")

    pay_text = 'Free entry' if event.is_free or subtotal == 0 else f'£{subtotal:.2f} to pay at the venue'
    return Response({
        'success': True,
        'booking_reference': booking.booking_reference,
        'booking_uuid': str(booking.uuid),
        'subtotal': float(subtotal),
        'deposit_due': 0,
        'balance_due': float(subtotal),
        'pay_at_venue': True,
        'message': f'Your places at {event.title} are reserved ({pay_text}). Booking ref: {booking.booking_reference}',
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def create_event_request(request):
    """Public endpoint — a customer asks Go Kids Play to organise an event for them."""
    from datetime import date as date_type
    data = request.data
    contact, contact_error = _clean_contact(data)
    if contact_error:
        return Response({'error': contact_error}, status=status.HTTP_400_BAD_REQUEST)

    def parse_date(value):
        try:
            return date_type.fromisoformat(str(value)) if value else None
        except ValueError:
            return False

    preferred = parse_date(data.get('preferred_date'))
    alternative = parse_date(data.get('alternative_date'))
    if not preferred:
        return Response({'error': 'Please choose a preferred date.'}, status=status.HTTP_400_BAD_REQUEST)
    if alternative is False:
        return Response({'error': 'The alternative date is not valid.'}, status=status.HTTP_400_BAD_REQUEST)
    if preferred < timezone.localdate():
        return Response({'error': 'Please choose a date in the future.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        num_children = max(0, int(data.get('num_children') or 0))
        num_adults = max(0, int(data.get('num_adults') or 0))
    except (TypeError, ValueError):
        return Response({'error': 'Guest numbers must be whole numbers.'}, status=status.HTTP_400_BAD_REQUEST)
    if num_children + num_adults == 0:
        return Response({'error': 'Please tell us roughly how many guests.'}, status=status.HTTP_400_BAD_REQUEST)

    details = (data.get('details') or '').strip()
    if len(details) < 10:
        return Response({'error': 'Please tell us a little about the event you would like.'},
                        status=status.HTTP_400_BAD_REQUEST)

    event_type = data.get('event_type') or 'CUSTOM'
    if event_type not in dict(SpecialEvent.EVENT_TYPE_CHOICES):
        event_type = 'CUSTOM'

    req = EventRequest.objects.create(
        event_type=event_type,
        preferred_date=preferred,
        alternative_date=alternative or None,
        preferred_time=(data.get('preferred_time') or '')[:50],
        num_children=num_children,
        num_adults=num_adults,
        budget=(data.get('budget') or '')[:100],
        details=details[:5000],
        ip_address=request.META.get('REMOTE_ADDR'),
        **contact,
    )
    try:
        from apps.emails.notifications import event_request_received
        event_request_received(req)
    except Exception as email_err:
        logger.warning(f"Event request e-mails failed: {email_err}")
    return Response({
        'success': True,
        'reference': req.reference,
        'message': f"Thanks {req.name.split(' ')[0]}! We've received your request (ref {req.reference}) "
                   "and will contact you shortly.",
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def event_booking_confirmation(request, booking_uuid):
    """Public endpoint — returns booking details by UUID for confirmation page."""
    try:
        booking = EventBooking.objects.select_related('event').get(uuid=booking_uuid)
    except EventBooking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'booking_reference': booking.booking_reference,
        'name': booking.name,
        'email': booking.email,
        'event': {
            'title': booking.event.title,
            'date': booking.event.date,
            'start_time': booking.event.start_time,
            'end_time': booking.event.end_time,
            'emoji': booking.event.emoji,
        },
        'num_children': booking.num_children,
        'num_adults': booking.num_adults,
        'subtotal': float(booking.subtotal),
        'deposit_amount': float(booking.deposit_amount),
        'amount_paid': float(booking.amount_paid),
        'balance_due': float(booking.balance_due),
        'status': booking.status,
        'payment_status': booking.payment_status,
        'special_instructions': booking.event.special_instructions,
    })
