from rest_framework.pagination import PageNumberPagination
from rest_framework import viewsets, permissions
from rest_framework import serializers as drf_serializers
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework import status
from .models import Customer, Booking, Transaction, BookingBlock, PartyBooking, SessionBookingHistory, PartyBookingHistory, BookingAuditLog
from .serializers import CustomerSerializer, BookingSerializer, TransactionSerializer, BookingBlockSerializer, PartyBookingSerializer, SessionBookingHistorySerializer, PartyBookingHistorySerializer, BookingAuditLogSerializer
from .permissions import IsStaffUser, IsSuperAdminOnly
from .references import normalise_reference
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from django.http import HttpResponse
from django.utils import timezone
from django.db import transaction
import json
from decimal import Decimal

from django.db.models import Sum, Count, Max, Q

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsStaffUser]  # Allow employees to access customers

    def get_queryset(self):
        from apps.emails.models import EmailLog
        from django.db.models import Subquery, OuterRef, IntegerField
        from django.db.models.functions import Coalesce

        email_count_sq = EmailLog.objects.filter(
            recipient_email=OuterRef('email')
        ).values('recipient_email').annotate(c=Count('id')).values('c')

        queryset = Customer.objects.annotate(
            booking_count=Count('bookings'),
            total_spent=Sum('bookings__amount'),
            last_visit=Max('bookings__date'),
            email_count=Coalesce(Subquery(email_count_sq, output_field=IntegerField()), 0)
        )
        
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(email__icontains=search) | 
                Q(phone__icontains=search)
            )
            
        return queryset

    @action(detail=True, methods=['get'])
    def emails(self, request, pk=None):
        customer = self.get_object()
        from apps.emails.models import EmailLog
        from apps.emails.serializers import EmailLogSerializer
        emails = EmailLog.objects.filter(recipient_email=customer.email).order_by('-created_at')
        serializer = EmailLogSerializer(emails, many=True)
        return Response(serializer.data)

class BookingPagination(PageNumberPagination):
    """Fast pagination for admin booking lists. Default 50/page, max 200."""
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200
    page_query_param = 'page'

def _online_booking_paused(kind: str):
    """
    Admin → Settings switches: maintenance mode, or online session / party booking
    turned off. Returns an error Response for public bookings, or None.
    """
    from apps.core.models import GlobalSettings
    site = GlobalSettings.objects.first()
    if not site:
        return None
    enabled = site.party_bookings_enabled if kind == 'party' else site.online_booking_enabled
    if site.maintenance_mode or not enabled:
        what = 'party booking' if kind == 'party' else 'online booking'
        return Response({'detail': f"Sorry, {what} is paused at the moment. Please call us on {site.contact_phone} to book.",
                         'code': 'BOOKINGS_PAUSED'}, status=status.HTTP_400_BAD_REQUEST)
    return None


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    pagination_class = BookingPagination  # 50 per page by default; use ?page_size=N to override

    def paginate_queryset(self, queryset):
        """Paginate only when ?page= or ?page_size= is given; admin screens without them get the full list."""
        params = self.request.query_params
        if 'page' not in params and 'page_size' not in params:
            return None
        return super().paginate_queryset(queryset)
    
    def get_queryset(self):
        queryset = Booking.objects.all()
        
        # If user is authenticated and not staff, only show their own bookings
        user = self.request.user
        if user and user.is_authenticated and not (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)):
            # Fallback if somehow a non-staff Django User accesses this
            queryset = queryset.filter(email=user.email)
        elif not (self.request.user and self.request.user.is_authenticated):
            # Unauthenticated users get empty list (except for actions that are AllowAny)
            if self.action not in ['create', 'ticket', 'check_duplicate', 'slot_availability']:
                return Booking.objects.none()
        
        # Filtering
        booking_type = self.request.query_params.get('type', None)
        if booking_type:
            queryset = queryset.filter(type=booking_type)
            
        # Accept 'status' query param and filter by 'booking_status' field
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(booking_status=status)
            
        date = self.request.query_params.get('date', None)
        if date:
            queryset = queryset.filter(date=date)
            
        search = self.request.query_params.get('search', None)
        if search:
            search = search.strip()
            query = (
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search) |
                Q(booking_number__icontains=search) |
                Q(booking_number__icontains=normalise_reference(search)) |
                Q(uuid__icontains=search)
            )
            digits = ''.join(ch for ch in search if ch.isdigit())
            if len(digits) >= 6:  # phone typed with or without spaces
                query |= Q(phone__icontains=digits[-6:])
            if search.isdigit():
                query |= Q(id=int(search))
            queryset = queryset.filter(query)
        
        # Arrival status filter
        has_arrived = self.request.query_params.get('has_arrived', None)
        if has_arrived is not None:
            if has_arrived.lower() == 'true':
                queryset = queryset.filter(arrived=True)
            elif has_arrived.lower() == 'false':
                queryset = queryset.filter(arrived=False)
            
        # Activity filter (e.g. roller-skating, ten-pin-bowling)
        activity = self.request.query_params.get('activity', None)
        if activity:
            queryset = queryset.filter(activity__icontains=activity)

        # Ordering
        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-created_at')  # Default to newest first

        return queryset.select_related('customer', 'voucher').prefetch_related('transactions')
    
    def get_permissions(self):
        # Allow public access ONLY for create and ticket retrieval
        if self.action in ['create', 'ticket', 'check_duplicate', 'slot_availability']:
            return [permissions.AllowAny()]
        # Allow authenticated customers to view and update their own bookings
        if self.action in ['retrieve', 'update', 'partial_update', 'list']:
            return [permissions.IsAuthenticated()]
        return [IsStaffUser()]  # Allow employees to access other methods
    
    def create(self, request, *args, **kwargs):
        """
        Override create to:
        1. Atomically enforce Go Kids Play session capacity (prevents race-condition overbooking)
        2. Validate date/slot against admin availability overrides
        3. Trigger confirmation email after successful creation

        Go Kids Play uses general session capacity (not activity-specific lanes).
        Capacity: GKP_SESSION_CAPACITY total visitors per time slot.
        """
        import logging
        logger = logging.getLogger('apps.emails')
        logger.info("=== BookingViewSet.create() called ===")

        from .availability_service import GKPAvailabilityService
        from datetime import date as date_type

        # ── Public (non-staff) bookings: never trust money/status fields ──────
        # The website creates bookings anonymously, so anyone could call this
        # endpoint directly. Only an allowlist of fields is accepted and the
        # price is recalculated server-side from the CMS booking config.
        is_staff = bool(request.user and request.user.is_authenticated and request.user.is_staff)
        voucher_to_count = None
        if is_staff:
            data = request.data
        else:
            paused = _online_booking_paused('session')
            if paused:
                return paused
            from .unpaid import release_unpaid_bookings
            release_unpaid_bookings()  # abandoned checkouts free their places first
            data, pricing_error, voucher_to_count = self._sanitize_public_booking(request.data)
            if pricing_error:
                return Response({'detail': pricing_error, 'code': 'INVALID_VOUCHER'},
                                status=status.HTTP_400_BAD_REQUEST)

        # ── Extract key fields ────────────────────────────────────────────────
        req_date_str = data.get('date')
        req_time = str(data.get('time', ''))[:5]   # normalise to "HH:MM"
        req_adults = int(data.get('adults') or 0)
        req_kids = int(data.get('kids') or 0)
        req_headcount = req_adults + req_kids

        try:
            with transaction.atomic():
                # ── Parse date ────────────────────────────────────────────────
                try:
                    from datetime import datetime
                    req_date = datetime.strptime(req_date_str, '%Y-%m-%d').date() if req_date_str else None
                except (ValueError, TypeError):
                    return Response(
                        {'detail': 'Invalid date format. Use YYYY-MM-DD.', 'code': 'INVALID_DATE'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if not req_date:
                    return Response(
                        {'detail': 'A booking date is required.', 'code': 'MISSING_DATE'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # ── Public bookings must use a real session start for that day ──
                # (opening hours / session mode from the CMS; staff may book anything)
                if not is_staff:
                    from .opening_hours import is_session_still_bookable, session_start_times
                    if req_time not in session_start_times(req_date):
                        return Response({'detail': 'Please choose one of the available session times.',
                                         'code': 'INVALID_TIME'}, status=status.HTTP_400_BAD_REQUEST)
                    if not is_session_still_bookable(req_date, req_time):
                        return Response({'detail': 'Online booking for this session has closed. Please choose another date or time.',
                                         'code': 'PAST_DATE'}, status=status.HTTP_400_BAD_REQUEST)

                # ── Go Kids Play capacity check (select_for_update for race safety) ──
                svc = GKPAvailabilityService()
                capacity_result = svc.check_session_capacity(req_date, req_time, req_headcount)

                if not capacity_result['allowed']:
                    return Response(
                        {
                            'detail': capacity_result['reason'],
                            'code': capacity_result.get('code', 'CAPACITY_EXCEEDED'),
                            'spots_free': capacity_result['spots_free'],
                            'spots_needed': capacity_result['spots_needed'],
                        },
                        status=status.HTTP_409_CONFLICT
                    )

                # ── Capacity OK — proceed with normal DRF create ──────────────
                serializer = self.get_serializer(data=data)
                serializer.is_valid(raise_exception=True)
                self.perform_create(serializer)
                if not is_staff:
                    # Paid through SumUp next; released if left unpaid (unpaid.py)
                    Booking.objects.filter(pk=serializer.instance.pk).update(online_checkout=True)
                elif serializer.instance.paid_amount and serializer.instance.paid_amount > 0:
                    # Walk-in paid at the desk: keep it in Admin → Payments
                    from apps.payments.services import PaymentService
                    PaymentService.record_venue_payment(
                        serializer.instance, serializer.instance.paid_amount,
                        recorded_by=getattr(request.user, 'email', '') or 'admin', note='Walk-in paid at the desk')
                if voucher_to_count is not None:
                    from apps.shop.services import VoucherUnavailable, redeem_voucher
                    try:
                        redeem_voucher(voucher_to_count, booking=serializer.instance, email=data.get('email') or '',
                                       discount=serializer.instance.discount_amount or 0)
                    except VoucherUnavailable as exc:
                        raise drf_serializers.ValidationError({'detail': str(exc), 'code': 'INVALID_VOUCHER'})
                response = Response(serializer.data, status=status.HTTP_201_CREATED)

        except drf_serializers.ValidationError:
            raise  # field errors go back to the client as a normal 400
        except Exception:
            import traceback
            logger.error(f"Booking creation failed:\n{traceback.format_exc()}")
            return Response(
                {"detail": "Booking could not be completed. Please try again or contact us."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ── Post-create: log success ──────────────────────────────────────────
        if response.status_code == 201:
            booking_id = response.data.get('id')
            logger.info(f"GKP Booking {booking_id} created successfully (capacity check passed)")
            # Email confirmation is sent AFTER payment verification
            # See apps/payments/services.py -> PaymentService.verify_and_complete_payment()

        return response


    # Fields a member of the public may set when creating a session booking
    PUBLIC_BOOKING_FIELDS = (
        'name', 'email', 'phone', 'date', 'time', 'duration',
        'activity', 'parking_plates', 'customer',
    )

    def _sanitize_public_booking(self, raw):
        """Build the booking payload for a non-staff request: allowlisted fields + server-side price.

        Public bookings buy all-access admission tickets: `tickets` = {plan_id: qty} (or a list of
        {plan_id, qty}) referring to the active Session Pricing Plans. Prices always come from the plans.
        """
        from .pricing import price_admission

        clean = {key: raw.get(key) for key in self.PUBLIC_BOOKING_FIELDS if key in raw}
        booking_datetime = (
            f"{raw.get('date')}T{str(raw.get('time', ''))[:5]}" if raw.get('date') and raw.get('time') else None
        )
        price = price_admission(
            tickets=raw.get('tickets'),
            add_ons=raw.get('add_ons'),
            voucher_code=raw.get('voucher_code'),
            booking_datetime=booking_datetime,
            include_online_fee=True,
            email=raw.get('email'),
        )
        if price.error:
            return None, price.error, None

        status_value = raw.get('booking_status')
        clean.update({
            # Headcount fields derived from the tickets: playing tickets are counted as kids
            # (they use the play areas and the session capacity), non-playing adults as spectators
            'adults': 0,
            'kids': price.players,
            'spectators': price.spectators,
            'tickets': price.tickets,
            'subtotal': str(price.subtotal),
            'discount_amount': str(price.discount),
            'amount': str(price.amount),
            'add_ons': price.add_ons or None,
            'voucher': price.voucher.pk if price.voucher else None,
            'voucher_code': price.voucher_code,
            # Payment is never set by the client — it is recorded by the payment flow
            'paid_amount': '0.00',
            'payment_status': 'PENDING',
            'booking_status': status_value if status_value in ('PENDING', 'CONFIRMED') else 'PENDING',
            'status': status_value if status_value in ('PENDING', 'CONFIRMED') else 'PENDING',
            'type': 'SESSION',
        })
        return clean, '', price.voucher

    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def update_status(self, request, pk=None):
        """
        Admin-only action to directly update booking_status and/or payment_status.
        POST /api/v1/bookings/bookings/{id}/update_status/
        Body: { "booking_status": "CONFIRMED" | "CANCELLED" | "PENDING" | "COMPLETED" }
        """
        booking = self.get_object()
        new_status = request.data.get('booking_status')
        new_payment_status = request.data.get('payment_status')

        valid_booking_statuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
        valid_payment_statuses = ['PENDING', 'PAID', 'PARTIAL', 'REFUNDED', 'FAILED']

        if new_status and new_status not in valid_booking_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {valid_booking_statuses}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if new_payment_status and new_payment_status not in valid_payment_statuses:
            return Response(
                {'error': f'Invalid payment_status. Must be one of: {valid_payment_statuses}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        changed_by = getattr(request.user, 'email', None) or getattr(request.user, 'username', 'admin')
        update_fields = []

        if new_status:
            old_status = booking.booking_status
            booking.booking_status = new_status
            update_fields.append('booking_status')
            BookingAuditLog.objects.create(
                booking_id=booking.id,
                booking_type='SESSION',
                field_changed='booking_status',
                old_value=old_status,
                new_value=new_status,
                changed_by=changed_by,
            )

        if new_payment_status:
            old_payment_status = booking.payment_status
            booking.payment_status = new_payment_status
            update_fields.append('payment_status')
            BookingAuditLog.objects.create(
                booking_id=booking.id,
                booking_type='SESSION',
                field_changed='payment_status',
                old_value=old_payment_status,
                new_value=new_payment_status,
                changed_by=changed_by,
            )

            # Marked PAID by staff (cash / card at the desk): record the outstanding amount
            if new_payment_status == 'PAID' and booking.paid_amount < booking.amount:
                from apps.payments.services import PaymentService
                PaymentService.record_venue_payment(booking, booking.amount - booking.paid_amount, recorded_by=changed_by)
                booking.paid_amount = booking.amount
                update_fields.append('paid_amount')

        if update_fields:
            booking.save(update_fields=update_fields)

        serializer = self.get_serializer(booking)
        return Response(serializer.data)


    @action(detail=True, methods=['get'], permission_classes=[IsStaffUser])
    def audit_log(self, request, pk=None):
        """
        Returns the full audit trail for a specific booking.
        GET /api/v1/bookings/bookings/{id}/audit_log/
        """
        logs = BookingAuditLog.objects.filter(booking_id=pk, booking_type='SESSION').order_by('-timestamp')
        serializer = BookingAuditLogSerializer(logs, many=True)
        return Response(serializer.data)


    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def duplicate(self, request, pk=None):
        """
        Duplicates an existing session booking to a new date/time.
        POST /api/v1/bookings/bookings/{id}/duplicate/
        Body: { "date": "YYYY-MM-DD", "time": "HH:MM" }
        """
        original = get_object_or_404(Booking, pk=pk)
        new_date = request.data.get('date')
        new_time = request.data.get('time')

        if not new_date or not new_time:
            return Response({'error': 'date and time are required'}, status=status.HTTP_400_BAD_REQUEST)

        # The copy gets its own booking number when it is saved
        new_booking = Booking.objects.create(
            name=original.name,
            email=original.email,
            phone=original.phone,
            date=new_date,
            time=new_time,
            duration=original.duration,
            adults=original.adults,
            kids=original.kids,
            spectators=original.spectators,
            subtotal=original.subtotal,
            discount_amount=original.discount_amount,
            amount=original.amount,
            paid_amount=0,  # Reset payment — new booking hasn't been paid
            type=original.type,
            activity=original.activity,
            add_ons=original.add_ons,
            booking_status='PENDING',
            payment_status='PENDING',
            waiver_status='PENDING',
            customer=original.customer,
        )

        # Log the duplication in audit trail
        changed_by = getattr(request.user, 'email', None) or getattr(request.user, 'username', 'admin')
        BookingAuditLog.objects.create(
            booking_id=new_booking.id,
            booking_type='SESSION',
            field_changed='created_via_duplicate',
            old_value=None,
            new_value=f'Duplicated from booking #{original.id}',
            changed_by=changed_by,
        )

        serializer = self.get_serializer(new_booking)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def check_duplicate(self, request):
        """
        Public endpoint to check for duplicate bookings.
        Returns validation result without exposing full booking details.
        """
        email = request.query_params.get('email')
        date = request.query_params.get('date')
        time = request.query_params.get('time')
        
        if not all([email, date, time]):
            return Response(
                {'error': 'Missing required parameters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check for bookings with same details created in last 5 minutes
        five_minutes_ago = timezone.now() - timezone.timedelta(minutes=5)
        
        exists = Booking.objects.filter(
            email=email,
            date=date,
            time=time,
            created_at__gte=five_minutes_ago
        ).exists()
        
        return Response({'exists': exists})

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def slot_availability(self, request):
        """
        Public endpoint returning Go Kids Play slot availability for a given date.

        Query params:
          ?date=2026-09-20  (required)

        Response:
          {
            "date": "2026-09-20",
            "date_status": "OPEN",
            "closure_reason": null,
            "blocks_normal_bookings": false,
            "blocks_party_bookings": false,
            "session_capacity": 150,
            "slots": {
              "10:00": {
                "slot_start": "10:00",
                "slot_end": "12:00",
                "booking_type": "SESSION",
                "total_capacity": 150,
                "booked_count": 42,
                "remaining_capacity": 108,
                "status": "AVAILABLE",
                "activity_availability": {
                  "soft-play": "AVAILABLE",
                  "laser-arena": "AVAILABLE",
                  "go-kart": "AVAILABLE",
                  "inflatable-park": "AVAILABLE"
                }
              }
            },
            "party_slots": { ... }
          }
        """
        from .availability_service import GKPAvailabilityService
        from datetime import datetime

        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'date parameter required'}, status=400)

        try:
            check_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

        from .unpaid import release_unpaid_bookings
        release_unpaid_bookings()  # abandoned checkouts don't count as taken

        svc = GKPAvailabilityService()
        availability = svc.get_full_availability(check_date)
        if not (request.user and request.user.is_authenticated and request.user.is_staff):
            # Who booked which party is for staff only
            for slot in (availability.get('party_slots') or {}).values():
                slot.pop('party_bookings', None)
        return Response(availability)

    @action(detail=False, methods=['get'], url_path='ticket/(?P<uuid>[^/.]+)')
    def ticket(self, request, uuid=None):
        booking = get_object_or_404(Booking, uuid=uuid)
        serializer = self.get_serializer(booking)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def mark_arrived(self, request, pk=None):
        """Mark a party booking as arrived"""
        party_booking = self.get_object()
        party_booking.arrived = True
        party_booking.save()
        
        serializer = self.get_serializer(party_booking)
        return Response({
            'success': True,
            'message': f'Party booking #{party_booking.id} marked as arrived',
            'booking': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def mark_not_arrived(self, request, pk=None):
        """Mark a party booking as not arrived"""
        party_booking = self.get_object()
        party_booking.arrived = False
        party_booking.save()
        
        serializer = self.get_serializer(party_booking)
        return Response({
            'success': True,
            'message': f'Party booking #{party_booking.id} marked as not arrived',
            'booking': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def mark_arrived(self, request, pk=None):
        """Mark a booking as arrived"""
        booking = self.get_object()
        booking.arrived = True
        booking.arrived_at = timezone.now()
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response({
            'success': True,
            'message': f'Booking #{booking.id} marked as arrived',
            'booking': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def mark_not_arrived(self, request, pk=None):
        """Mark a booking as not arrived"""
        booking = self.get_object()
        booking.arrived = False
        booking.arrived_at = None
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response({
            'success': True,
            'message': f'Booking #{booking.id} marked as not arrived',
            'booking': serializer.data
        })



class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.select_related('booking').all()
    serializer_class = TransactionSerializer
    permission_classes = [IsStaffUser]  # Allow employees to access transactions

class BookingBlockViewSet(viewsets.ModelViewSet):
    queryset = BookingBlock.objects.all()
    serializer_class = BookingBlockSerializer
    permission_classes = [IsStaffUser]  # Allow employees to manage booking blocks

class PublicBookingBlockViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API to fetch blocked dates for the Booking Wizard.
    Only returns active blocks that actually prevent bookings.
    """
    serializer_class = BookingBlockSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        blocking_types = ['BLOCKED_DATE', 'CLOSED', 'MAINTENANCE', 'PRIVATE_EVENT', 'OTHER']
        # Filter for active blocks in the future (or including today)
        return BookingBlock.objects.filter(
            type__in=blocking_types,
            end_date__gte=timezone.now().date()
        )

class PublicSiteAlertViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API to fetch 'Closed Today' or 'Open Today' alerts for the current day.
    """
    serializer_class = BookingBlockSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        # Use simple date-only comparison to avoid PostgreSQL type mismatch
        # (DateField cannot be compared to timezone-aware datetime)
        today = timezone.now().date()

        # Today's special opening, or a closure of play sessions (Calendar → Opening Days)
        from .opening_hours import CLOSING_BLOCK_TYPES, OPENING_BLOCK_TYPE
        return BookingBlock.objects.filter(
            Q(type=OPENING_BLOCK_TYPE) | Q(type__in=CLOSING_BLOCK_TYPES, blocks_normal_bookings=True),
            start_date__lte=today,
            end_date__gte=today,
            slot_time__isnull=True,
        ).order_by('-start_date')


# Custom function-based view for party booking creation (bypasses serializer bug)
def _party_booking_summary(booking):
    return {
        'id': booking.id,
        'uuid': str(booking.uuid),
        'booking_number': booking.booking_number,
        'name': booking.name,
        'email': booking.email,
        'phone': booking.phone,
        'date': str(booking.date),
        'time': str(booking.time),
        'package_name': booking.package_name,
        'kids': booking.kids,
        'adults': booking.adults,
        'amount': float(booking.amount),
        'paid_amount': float(booking.paid_amount or 0),
        'remaining_balance': float(booking.amount - (booking.paid_amount or 0)),
        'deposit_amount': float(booking.deposit_amount),
        'payment_type': booking.payment_type,
        'payment_status': booking.payment_status,
        'birthday_child_name': booking.birthday_child_name,
        'birthday_child_age': booking.birthday_child_age,
        'status': booking.status,
        'booking_status': booking.status,
        'arrived': booking.arrived,
        'arrived_at': booking.arrived_at.isoformat() if booking.arrived_at else None,
        'created_at': booking.created_at.isoformat(),
        'updated_at': booking.updated_at.isoformat(),
    }


@api_view(['POST', 'GET'])
@permission_classes([permissions.AllowAny])  # POST is public (website wizard); GET is checked below
def create_party_booking_view(request):
    """List party bookings (staff only) or create one (public website wizard or staff)."""
    import logging
    logger = logging.getLogger(__name__)
    is_staff = bool(request.user and request.user.is_authenticated and request.user.is_staff)

    if request.method == 'GET':
        # Customer names, emails and phone numbers — staff only
        if not is_staff:
            return Response({'detail': 'Authentication credentials were not provided.'},
                            status=status.HTTP_401_UNAUTHORIZED)
        # ?search= (name, email, phone, booking number GP…, child), ?status=, ?date=, ?page_size=
        bookings = PartyBooking.objects.select_related('customer').order_by('-created_at')
        search = (request.query_params.get('search') or '').strip()
        if search:
            query = (Q(name__icontains=search) | Q(email__icontains=search) | Q(phone__icontains=search)
                     | Q(booking_number__icontains=normalise_reference(search)) | Q(birthday_child_name__icontains=search))
            digits = ''.join(ch for ch in search if ch.isdigit())
            if len(digits) >= 6:
                query |= Q(phone__icontains=digits[-6:])
            if search.isdigit():
                query |= Q(id=int(search))
            bookings = bookings.filter(query)
        if request.query_params.get('status'):
            bookings = bookings.filter(status=request.query_params['status'])
        if request.query_params.get('date'):
            bookings = bookings.filter(date=request.query_params['date'])
        try:
            limit = min(2000, max(1, int(request.query_params.get('page_size') or 1000)))
        except ValueError:
            limit = 1000
        return Response([_party_booking_summary(b) for b in bookings[:limit]])

    data = request.data

    def as_int(value, default=0):
        try:
            return max(0, int(value))
        except (TypeError, ValueError):
            return default

    for required in ('name', 'email', 'phone', 'date', 'time'):
        if not data.get(required):
            return Response({'detail': f'{required} is required'}, status=status.HTTP_400_BAD_REQUEST)

    kids = as_int(data.get('kids'))
    adults = as_int(data.get('adults'))
    payment_type = 'FULL' if data.get('payment_type') == 'FULL' else 'DEPOSIT'
    voucher_to_count = None
    voucher_discount = Decimal('0')

    # Public party bookings only on dates open for parties (opening calendar)
    if not is_staff:
        paused = _online_booking_paused('party')
        if paused:
            return paused
        from .unpaid import release_unpaid_bookings
        release_unpaid_bookings()  # abandoned checkouts free their places first
        from datetime import date as date_cls
        from .opening_hours import day_status
        try:
            party_date = date_cls.fromisoformat(str(data.get('date'))[:10])
        except ValueError:
            return Response({'detail': 'Invalid date.'}, status=status.HTTP_400_BAD_REQUEST)
        if party_date < timezone.localdate():
            return Response({'detail': 'Please choose a date in the future.'}, status=status.HTTP_400_BAD_REQUEST)
        from apps.cms.models import PartyBookingConfig
        party_config = PartyBookingConfig.objects.filter(active=True).order_by('id').first()
        min_kids = max(1, int(getattr(party_config, 'min_participants', 0) or 10))
        if kids < min_kids:
            return Response({'detail': f'A party needs at least {min_kids} children.', 'code': 'TOO_FEW_GUESTS'},
                            status=status.HTTP_400_BAD_REQUEST)
        day = day_status(party_date)
        if not day['parties_open']:
            return Response({'detail': f"We're not taking party bookings on this date ({day['reason'] or 'closed'}). Please choose another date.",
                             'code': 'DATE_CLOSED'}, status=status.HTTP_400_BAD_REQUEST)
        # Start time: one of the party times (Website Content → Party Booking) that leaves
        # a full 2-hour party before closing (same rule as the wizard)
        from .availability_service import _to_24h
        requested = _to_24h(str(data.get('time')))
        configured = [t for t in (_to_24h(x) for x in (getattr(party_config, 'available_time_slots', None) or [])) if t]
        def fits(t):
            return day['open'] <= t and f"{int(t[:2]) + 2:02d}{t[2:]}" <= day['close']
        allowed = [t for t in configured if fits(t)] or [t for t in (f'{h:02d}:00' for h in range(24)) if fits(t)]
        if requested not in allowed:
            return Response({'detail': 'Please choose one of the available party times.', 'code': 'INVALID_TIME',
                             'times': allowed}, status=status.HTTP_400_BAD_REQUEST)
        data = {**{k: data.get(k) for k in data.keys()}, 'time': requested}  # saved as HH:MM

    if is_staff:
        # Staff/admin bookings may set custom amounts and statuses
        amount = Decimal(str(data.get('amount') or 0))
        package_price = Decimal(str(data.get('package_price') or 250))
        deposit_amount = Decimal(str(data.get('deposit_amount') or 0))
        booking_status = data.get('status') or 'PENDING'
    else:
        # Public bookings: price is always calculated server-side
        from .pricing import price_party_booking
        price = price_party_booking(kids=kids, adults=adults, voucher_code=data.get('voucher_code'), email=data.get('email'),
                                    booking_datetime=f"{party_date}T{str(data.get('time'))[:5]}")
        if price.error:
            return Response({'detail': price.error, 'code': 'INVALID_VOUCHER'}, status=status.HTTP_400_BAD_REQUEST)
        amount, package_price, deposit_amount = price.amount, price.package_price, price.deposit
        booking_status = 'PENDING'
        voucher_to_count = price.voucher
        voucher_discount = price.discount

    try:
        with transaction.atomic():
            # Public bookings: the party slot must still have room (rows locked to avoid double booking)
            if not is_staff:
                from .availability_service import GKPAvailabilityService
                capacity = GKPAvailabilityService().check_party_capacity(
                    party_date, str(data.get('time'))[:5], kids + adults)
                if not capacity['allowed']:
                    return Response({'detail': 'Sorry, that party time is now fully booked. Please choose another time.'
                                     if capacity['code'] == 'CAPACITY_EXCEEDED' else capacity['reason'],
                                     'code': capacity['code']}, status=status.HTTP_409_CONFLICT)

            customer = None
            if data.get('email'):
                customer, created = Customer.objects.get_or_create(
                    email__iexact=data['email'],
                    defaults={'email': str(data['email']).strip().lower(),
                              'name': data.get('name', ''), 'phone': data.get('phone', '')},
                )
                if not created and not customer.name:
                    customer.name = data.get('name', '')
                    customer.phone = data.get('phone', '')
                    customer.save()

            booking = PartyBooking.objects.create(
                name=data.get('name'),
                email=data.get('email'),
                phone=data.get('phone'),
                date=data.get('date'),
                time=data.get('time'),
                package_name=data.get('package_name') or 'Standard Party',
                kids=kids,
                adults=adults,
                spectators=adults,
                amount=amount,
                package_price=package_price,
                deposit_amount=deposit_amount,
                payment_type=payment_type,
                birthday_child_name=data.get('birthday_child_name'),
                birthday_child_age=as_int(data.get('birthday_child_age'), None) if data.get('birthday_child_age') else None,
                special_requests=data.get('special_requests'),
                dietary_restrictions=data.get('dietary_restrictions'),
                status=booking_status,
                payment_status='PENDING',
                customer=customer,
                online_checkout=not is_staff,  # released if left unpaid (unpaid.py)
                voucher=voucher_to_count,
                voucher_code=voucher_to_count.code if voucher_to_count else None,
                discount_amount=voucher_discount,
            )
            if voucher_to_count is not None:
                from apps.shop.services import redeem_voucher
                redeem_voucher(voucher_to_count, party_booking=booking, email=data.get('email') or '',
                               discount=voucher_discount)
    except Exception as exc:
        from apps.shop.services import VoucherUnavailable
        if isinstance(exc, VoucherUnavailable):
            return Response({'detail': str(exc), 'code': 'INVALID_VOUCHER'}, status=status.HTTP_400_BAD_REQUEST)
        logger.exception('Party booking creation failed')
        return Response({'detail': 'Failed to create party booking. Please check your details and try again.'},
                        status=status.HTTP_400_BAD_REQUEST)

    return Response(_party_booking_summary(booking), status=status.HTTP_201_CREATED)

class PartyBookingViewSet(viewsets.ModelViewSet):
    queryset = PartyBooking.objects.all()
    serializer_class = PartyBookingSerializer
    
    def get_permissions(self):
        # Only the e-ticket (looked up by its private uuid) is public. Website party
        # bookings go through create_party_booking_view, which prices and checks
        # the date server-side — creating through this viewset is staff-only.
        if self.action == 'ticket':
            return [permissions.AllowAny()]
        return [IsStaffUser()]

    def get_queryset(self):
        queryset = PartyBooking.objects.all()
        
        # If user is authenticated and not staff, only show their own bookings
        user = self.request.user
        if user and user.is_authenticated and not (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)):
            queryset = queryset.filter(email=user.email)
        elif not (self.request.user and self.request.user.is_authenticated):
            if self.action not in ['create', 'ticket']:
                return PartyBooking.objects.none()
        
        # Status filter
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Date filter
        date = self.request.query_params.get('date', None)
        if date:
            queryset = queryset.filter(date=date)
        
        # Search filter
        search = self.request.query_params.get('search', None)
        if search:
            search = search.strip()
            query = (
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search) |
                Q(booking_number__icontains=search) |
                Q(booking_number__icontains=normalise_reference(search)) |
                Q(uuid__icontains=search) |
                Q(birthday_child_name__icontains=search)
            )
            if search.isdigit():
                query |= Q(id=int(search))
            queryset = queryset.filter(query)
        
        # Arrival status filter
        has_arrived = self.request.query_params.get('has_arrived', None)
        if has_arrived is not None:
            if has_arrived.lower() == 'true':
                queryset = queryset.filter(arrived=True)
            elif has_arrived.lower() == 'false':
                queryset = queryset.filter(arrived=False)
        
        # Ordering
        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-created_at')
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Override create to trigger confirmation email after party booking is saved."""
        import logging
        logger = logging.getLogger('apps.bookings')
        logger.info("=== PartyBookingViewSet.create() called ===")

        # Call parent create (handles validation, customer linking, DB save)
        response = super().create(request, *args, **kwargs)

        if response.status_code == 201:
            party_booking_id = response.data.get('id')
            logger.info(f"Party booking {party_booking_id} created successfully")

            # Trigger confirmation email if it is an admin manual booking (has payment_status PAID/CONFIRMED etc).
            # Otherwise payment gateway will trigger it later.
            try:
                party_booking = PartyBooking.objects.get(id=party_booking_id)
                if party_booking.payment_status in ['PAID', 'CONFIRMED'] or party_booking.booking_status == 'CONFIRMED':
                    from apps.emails.tasks import send_party_booking_confirmation_email
                    send_party_booking_confirmation_email(party_booking.id)
                    logger.info(f"Confirmation email queued for party booking {party_booking_id}")
            except Exception as e:
                logger.error(f"Email error for party booking {party_booking_id}: {e}", exc_info=True)

        return response


    @action(detail=False, methods=['get'], url_path='ticket/(?P<uuid>[^/.]+)')
    def ticket(self, request, uuid=None):
        party_booking = get_object_or_404(PartyBooking, uuid=uuid)
        serializer = self.get_serializer(party_booking)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsStaffUser])
    def audit_log(self, request, pk=None):
        """
        Returns the full audit trail for a specific party booking.
        GET /api/v1/bookings/party-bookings/{id}/audit_log/
        """
        logs = BookingAuditLog.objects.filter(booking_id=pk, booking_type='PARTY').order_by('-timestamp')
        serializer = BookingAuditLogSerializer(logs, many=True)
        return Response(serializer.data)


    @action(detail=True, methods=['post'])
    def add_participants(self, request, pk=None):
        """Add participant details to a party booking"""
        from django.utils import timezone
        
        party_booking = self.get_object()
        
        # Verify user is staff OR is the customer who owns this booking
        if not (request.user.is_staff or (request.user.is_authenticated and hasattr(request.user, 'customer') and request.user.customer == party_booking.customer)):
            return Response({"detail": "You do not have permission to modify this booking's participants."}, status=status.HTTP_403_FORBIDDEN)

        participants = request.data.get('participants', {})
        waiver_signed = request.data.get('waiver_signed', False)
        ip_address = request.META.get('REMOTE_ADDR')
        
        # Save participants data
        party_booking.participants = participants
        party_booking.waiver_signed = waiver_signed
        if waiver_signed:
            party_booking.waiver_signed_at = timezone.now()
            party_booking.waiver_ip_address = ip_address
        party_booking.save()
        
        # Participants are stored on the booking (party_booking.participants) — there is
        
        # no separate waiver record any more.
        
        return Response({
            'success': True,
            'message': 'Participants added successfully',
            'waiver_count': len(participants.get('adults', [])) + len(participants.get('minors', []))
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def resend_confirmation_email(self, request, pk=None):
        """Resend booking confirmation email to customer"""
        from apps.emails.views import resend_booking_confirmation
        return resend_booking_confirmation(party_booking, 'party')
    
    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def mark_arrived(self, request, pk=None):
        """Mark a party booking as arrived"""
        party_booking = self.get_object()
        party_booking.arrived = True
        party_booking.arrived_at = timezone.now()
        party_booking.save()
        
        serializer = self.get_serializer(party_booking)
        return Response({
            'success': True,
            'message': f'Party Booking #{party_booking.id} marked as arrived',
            'booking': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def mark_not_arrived(self, request, pk=None):
        """Mark a party booking as not arrived"""
        party_booking = self.get_object()
        party_booking.arrived = False
        party_booking.arrived_at = None
        party_booking.save()
        
        serializer = self.get_serializer(party_booking)
        return Response({
            'success': True,
            'message': f'Party Booking #{party_booking.id} marked as not arrived',
            'booking': serializer.data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def reschedule(self, request, pk=None):
        """Reschedule a party booking and apply 14-day rule admin fee if applicable"""
        from datetime import datetime
        from decimal import Decimal
        party_booking = self.get_object()
        
        # Accept both 'new_date'/'new_time' (from admin portal) and 'date'/'time'
        new_date = request.data.get('new_date') or request.data.get('date')
        new_time = request.data.get('new_time') or request.data.get('time')
        
        if not new_date or not new_time:
            return Response({'error': 'date/new_date and time/new_time are required'}, status=400)
            
        try:
            # Check 14-day rule
            current_party_date = party_booking.date
            if isinstance(current_party_date, str):
                current_party_date = datetime.strptime(current_party_date, '%Y-%m-%d').date()
            today = timezone.now().date()
            
            # If rescheduling within 14 days of the original party date, apply fee
            days_until_party = (current_party_date - today).days
            
            # Save original date if not already recorded
            if not party_booking.original_date:
                party_booking.original_date = party_booking.date
                
            fee_applied = Decimal('0')
            if days_until_party <= 14:
                fee_applied = Decimal('50.00')  # £50 Admin Fee
                party_booking.admin_fee_charged = (party_booking.admin_fee_charged or Decimal('0')) + fee_applied
                party_booking.amount = (party_booking.amount or Decimal('0')) + fee_applied
                
            party_booking.date = new_date
            party_booking.time = new_time
            party_booking.reschedule_count = (party_booking.reschedule_count or 0) + 1
            party_booking.status = 'RESCHEDULED'
            party_booking.save()
            party_booking.refresh_from_db()  # date / time back as date objects for the e-mail
            from apps.emails.notifications import party_rescheduled
            party_rescheduled(party_booking, fee=fee_applied)

            serializer = self.get_serializer(party_booking)
            return Response({
                'success': True,
                'message': f'Party rescheduled to {new_date} at {new_time}. {"£50 admin fee applied." if fee_applied else "No admin fee charged."}',
                'admin_fee_charged': float(fee_applied),
                'booking': serializer.data
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=400)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def add_party_participants_view(request, uuid):
    """
    Custom view to add participants to a party booking identified by UUID.
    This bypasses the PartyBookingViewSet lookup which expects integer PKs.
    """
    from django.utils import timezone
    
    party_booking = get_object_or_404(PartyBooking, uuid=uuid)
    participants = request.data.get('participants', {})
    waiver_signed = request.data.get('waiver_signed', False)
    ip_address = request.META.get('REMOTE_ADDR')
    
    # Save participants data
    party_booking.participants = participants
    party_booking.waiver_signed = waiver_signed
    if waiver_signed:
        party_booking.waiver_signed_at = timezone.now()
        party_booking.waiver_ip_address = ip_address
    party_booking.save()
    
    # Participants are stored on the booking (party_booking.participants) — there is
    
    # no separate waiver record any more.
    
    return Response({
        'success': True,
        'message': 'Participants added successfully',
        'waiver_count': len(participants.get('adults', [])) + len(participants.get('minors', []))
    })

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def party_booking_detail_view(request, id):
    """Custom view to get/update/delete party booking details by ID"""
    try:
        party_booking = PartyBooking.objects.get(pk=id)
        
        # Check permissions: must be staff or the customer who owns the booking
        if not request.user.is_staff:
            if not hasattr(request.user, 'customer') or request.user.customer != party_booking.customer:
                return Response({'error': 'Not authorized to view this booking'}, status=status.HTTP_403_FORBIDDEN)
        
        if request.method == 'GET':
            data = {
                'id': party_booking.id,
                'uuid': str(party_booking.uuid),
                'booking_number': party_booking.booking_number,
                'name': party_booking.name,
                'email': party_booking.email,
                'phone': party_booking.phone,
                'date': str(party_booking.date),
                'time': str(party_booking.time),
                'package_name': party_booking.package_name,
                'kids': party_booking.kids,
                'adults': party_booking.adults,
                'amount': float(party_booking.amount),
                'paid_amount': float(party_booking.paid_amount),
                'remaining_balance': float(party_booking.remaining_balance),
                'admin_fee_charged': float(party_booking.admin_fee_charged),
                'reschedule_count': party_booking.reschedule_count,
                'birthday_child_name': party_booking.birthday_child_name,
                'birthday_child_age': party_booking.birthday_child_age,
                'special_requests': party_booking.special_requests,
                'dietary_restrictions': party_booking.dietary_restrictions,
                'participants': party_booking.participants,
                'waiver_signed': party_booking.waiver_signed,
                'waiver_signed_at': party_booking.waiver_signed_at.isoformat() if party_booking.waiver_signed_at else None,
                'waiver_ip_address': party_booking.waiver_ip_address,
                'status': party_booking.status,
                'payment_status': party_booking.payment_status,
                'customer': party_booking.customer.id if party_booking.customer else None,
                'created_at': party_booking.created_at.isoformat(),
                'updated_at': party_booking.updated_at.isoformat(),
            }
            return Response(data)
        
        elif request.method == 'PATCH':
            # Update party booking fields
            update_data = request.data
            if 'status' in update_data:
                party_booking.status = update_data['status']
            if 'booking_status' in update_data:
                party_booking.status = update_data['booking_status']
            if 'name' in update_data:
                party_booking.name = update_data['name']
            if 'email' in update_data:
                party_booking.email = update_data['email']
            if 'phone' in update_data:
                party_booking.phone = update_data['phone']
            if 'date' in update_data:
                party_booking.date = update_data['date']
            if 'time' in update_data:
                party_booking.time = update_data['time']
            if 'amount' in update_data:
                party_booking.amount = update_data['amount']
            
            party_booking.save()
            
            return Response({
                'id': party_booking.id,
                'uuid': str(party_booking.uuid),
                'status': party_booking.status,
                'updated_at': party_booking.updated_at.isoformat(),
            })
        
        elif request.method == 'DELETE':
            party_booking.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
    except PartyBooking.DoesNotExist:
        return Response({'success': False, 'error': 'Party booking not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsStaffUser])
def party_booking_update_status_view(request, id):
    """
    Admin-only: update a party booking's status and/or payment status.
    payment_status=PAID records the outstanding balance as paid at the venue.
    """
    try:
        party_booking = PartyBooking.objects.get(pk=id)
        changed_by = getattr(request.user, 'email', None) or 'admin'
        valid_statuses = {choice for choice, _ in PartyBooking.STATUS_CHOICES}
        new_status = request.data.get('booking_status') or request.data.get('status')
        new_payment_status = request.data.get('payment_status')
        if new_status and new_status not in valid_statuses:
            return Response({'error': f'Invalid status. Must be one of: {sorted(valid_statuses)}'}, status=400)
        if new_payment_status and new_payment_status not in ('PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED'):
            return Response({'error': 'Invalid payment_status.'}, status=400)

        update_fields = []
        with transaction.atomic():
            if new_status and new_status != party_booking.status:
                BookingAuditLog.objects.create(booking_id=party_booking.id, booking_type='PARTY', field_changed='status',
                                               old_value=party_booking.status, new_value=new_status, changed_by=changed_by)
                party_booking.status = new_status
                update_fields.append('status')
            if new_payment_status and new_payment_status != party_booking.payment_status:
                BookingAuditLog.objects.create(booking_id=party_booking.id, booking_type='PARTY', field_changed='payment_status',
                                               old_value=party_booking.payment_status, new_value=new_payment_status,
                                               changed_by=changed_by)
                if new_payment_status == 'PAID' and party_booking.paid_amount < party_booking.amount:
                    from apps.payments.services import PaymentService
                    PaymentService.record_venue_payment(party_booking, party_booking.amount - party_booking.paid_amount,
                                                        recorded_by=changed_by, note='Party balance paid at the venue')
                    party_booking.paid_amount = party_booking.amount
                    update_fields.append('paid_amount')
                party_booking.payment_status = new_payment_status
                update_fields.append('payment_status')
            if update_fields:
                party_booking.save(update_fields=update_fields)
        return Response({
            'id': party_booking.id,
            'status': party_booking.status,
            'booking_status': party_booking.status,
            'payment_status': party_booking.payment_status,
            'paid_amount': str(party_booking.paid_amount),
        })
    except PartyBooking.DoesNotExist:
        return Response({'error': 'Party booking not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsStaffUser])
def mark_party_arrived_view(request, pk):
    """Mark a party booking as arrived"""
    try:
        party_booking = PartyBooking.objects.get(pk=pk)
        party_booking.arrived = True
        party_booking.arrived_at = timezone.now()
        party_booking.save()
        
        return Response({
            'success': True,
            'message': f'Party Booking #{party_booking.id} marked as arrived'
        })
    except PartyBooking.DoesNotExist:
        return Response({'success': False, 'error': 'Party booking not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsStaffUser])
def mark_party_not_arrived_view(request, pk):
    """Mark a party booking as not arrived"""
    try:
        party_booking = PartyBooking.objects.get(pk=pk)
        party_booking.arrived = False
        party_booking.arrived_at = None
        party_booking.save()
        
        return Response({
            'success': True,
            'message': f'Party Booking #{party_booking.id} marked as not arrived'
        })
    except PartyBooking.DoesNotExist:
        return Response({'success': False, 'error': 'Party booking not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)

# Session Booking History ViewSet
class SessionBookingHistoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing session booking history.
    Allows listing and restoring bookings that were paid but not saved.
    """
    queryset = SessionBookingHistory.objects.all()
    serializer_class = SessionBookingHistorySerializer
    permission_classes = [IsStaffUser]  # Allow employees to view booking history
    
    def get_queryset(self):
        """By default, only show non-restored history records"""
        queryset = SessionBookingHistory.objects.all()
        
        # Filter by restored status
        show_restored = self.request.query_params.get('show_restored', 'false')
        if show_restored.lower() != 'true':
            queryset = queryset.filter(restored=False)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdminOnly])
    def restore(self, request, pk=None):
        """
        Restore a booking from history to the main Booking table.
        This operation is atomic and will mark the history record as restored.
        """
        try:
            with transaction.atomic():
                history = self.get_object()
                
                # Validate not already restored
                if history.restored:
                    return Response({
                        'success': False,
                        'error': 'This booking has already been restored',
                        'restored_at': history.restored_at,
                        'restored_by': history.restored_by.username if history.restored_by else None,
                        'restored_booking_id': history.restored_booking_id
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Create or get customer
                customer = None
                if history.email:
                    customer, created = Customer.objects.get_or_create(
                        email=history.email,
                        defaults={
                            'name': history.name,
                            'phone': history.phone,
                        }
                    )
                    if not created and not customer.name:
                        customer.name = history.name
                        customer.phone = history.phone
                        customer.save()
                
                # Create new booking from history data
                booking = Booking.objects.create(
                    name=history.name,
                    email=history.email,
                    phone=history.phone,
                    date=history.date,
                    time=history.time,
                    duration=history.duration,
                    adults=history.adults,
                    kids=history.kids,
                    spectators=history.spectators,
                    subtotal=history.subtotal,
                    discount_amount=history.discount_amount,
                    amount=history.amount,
                    voucher_code=history.voucher_code,
                    booking_status='CONFIRMED',  # Restored bookings are confirmed
                    payment_status='PAID' if history.payment_amount else 'PENDING',
                    waiver_status='PENDING',
                    type='MANUAL',  # Mark as manual since it's being restored by admin
                    customer=customer,
                )
                
                # Mark history as restored
                history.restored = True
                history.restored_at = timezone.now()
                history.restored_by = request.user
                history.restored_booking_id = booking.id
                history.save()
                
                # Serialize the created booking
                booking_serializer = BookingSerializer(booking)
                
                return Response({
                    'success': True,
                    'message': f'Booking restored successfully as Booking #{booking.id}',
                    'booking_id': booking.id,
                    'booking': booking_serializer.data,
                    'history_id': history.id
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Failed to restore booking: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PartyBookingHistoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing party booking history.
    Allows listing and restoring bookings that were paid but not saved.
    """
    queryset = PartyBookingHistory.objects.all()
    serializer_class = PartyBookingHistorySerializer
    permission_classes = [IsStaffUser]  # Allow employees to view party booking history
    
    def get_queryset(self):
        """By default, only show non-restored history records"""
        queryset = PartyBookingHistory.objects.all()
        
        # Filter by restored status
        show_restored = self.request.query_params.get('show_restored', 'false')
        if show_restored.lower() != 'true':
            queryset = queryset.filter(restored=False)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdminOnly])
    def restore(self, request, pk=None):
        """
        Restore a party booking from history to the main PartyBooking table.
        This operation is atomic and will mark the history record as restored.
        """
        try:
            with transaction.atomic():
                history = self.get_object()
                
                # Validate not already restored
                if history.restored:
                    return Response({
                        'success': False,
                        'error': 'This booking has already been restored',
                        'restored_at': history.restored_at,
                        'restored_by': history.restored_by.username if history.restored_by else None,
                        'restored_booking_id': history.restored_booking_id
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Create or get customer
                customer = None
                if history.email:
                    customer, created = Customer.objects.get_or_create(
                        email=history.email,
                        defaults={
                            'name': history.name,
                            'phone': history.phone,
                        }
                    )
                    if not created and not customer.name:
                        customer.name = history.name
                        customer.phone = history.phone
                        customer.save()
                
                # Create new party booking from history data
                party_booking = PartyBooking.objects.create(
                    name=history.name,
                    email=history.email,
                    phone=history.phone,
                    date=history.date,
                    time=history.time,
                    package_name=history.package_name,
                    kids=history.kids,
                    adults=history.adults,
                    amount=history.amount,
                    birthday_child_name=history.birthday_child_name,
                    birthday_child_age=history.birthday_child_age,
                    participants=history.participants,
                    status='CONFIRMED',  # Restored bookings are confirmed
                    customer=customer,
                )
                
                # Mark history as restored
                history.restored = True
                history.restored_at = timezone.now()
                history.restored_by = request.user
                history.restored_booking_id = party_booking.id
                history.save()
                
                # Serialize the created booking
                booking_serializer = PartyBookingSerializer(party_booking)
                
                return Response({
                    'success': True,
                    'message': f'Party booking restored successfully as Booking #{party_booking.id}',
                    'booking_id': party_booking.id,
                    'booking': booking_serializer.data,
                    'history_id': history.id
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Failed to restore party booking: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_opening_calendar(request):
    """
    Opening calendar for the booking wizards and the admin portal:
    GET ?start=YYYY-MM-DD&end=YYYY-MM-DD (up to 400 days) → one entry per date with
    sessions_open, parties_open, open, close, source and reason.
    """
    from datetime import date as date_cls, timedelta
    from .opening_hours import calendar_days
    today = timezone.localdate()
    try:
        start = date_cls.fromisoformat(request.query_params.get('start') or today.isoformat())
        end = date_cls.fromisoformat(request.query_params.get('end') or (start + timedelta(days=120)).isoformat())
    except ValueError:
        return Response({'detail': 'Use YYYY-MM-DD dates.'}, status=status.HTTP_400_BAD_REQUEST)
    if end < start or (end - start).days > 400:
        return Response({'detail': 'Choose a range of up to 400 days.'}, status=status.HTTP_400_BAD_REQUEST)
    return Response(calendar_days(start, end))
