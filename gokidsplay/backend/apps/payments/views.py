"""
Payment API Views.

Provides REST API endpoints for payment operations:
- Create payment order
- Verify payment
- Process refund
- Get booking payment status
"""

import logging
from decimal import Decimal, InvalidOperation
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from apps.bookings.permissions import IsStaffUser
from .services import payment_service

logger = logging.getLogger(__name__)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])  # Frontend needs to create orders
def create_payment_order(request):
    """
    Create a payment order.
    
    POST /api/payments/create-order
    
    Body:
        {
            "booking_id": 123,
            "booking_type": "session" or "party",
            "amount": 5000.00  # Optional, defaults to remaining balance
        }
    
    Returns:
        {
            "success": true,
            "order_id": "MOCK_ORDER_...",
            "amount": 5000.00,
            "currency": "GBP",
            "provider": "MOCK",
            ...
        }
    """
    try:
        booking_id = request.data.get('booking_id')
        booking_type = request.data.get('booking_type')
        amount = request.data.get('amount')
        
        # Validate required fields
        if not booking_id:
            return Response(
                {'error': 'booking_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not booking_type or booking_type not in ['session', 'party']:
            return Response(
                {'error': 'booking_type must be "session" or "party"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert amount if provided
        if amount is not None:
            try:
                amount = Decimal(str(amount))
            except (InvalidOperation, ValueError):
                return Response(
                    {'error': 'Invalid amount format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create order
        order_data = payment_service.create_payment_order(  # type: ignore[misc]
            booking_id=int(booking_id),
            booking_type=booking_type,
            amount=amount
        )
        
        return Response({
            'success': True,
            **order_data
        })
        
    except ValueError as e:
        logger.error(f"Validation error creating payment order: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error creating payment order: {str(e)}")
        return Response(
            {'error': f'Failed to create payment order: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])  # Frontend needs to verify payments
def verify_payment(request):
    """
    Verify a payment.
    
    POST /api/payments/verify
    
    Body (Mock):
        {
            "order_id": "MOCK_ORDER_...",
            "force_fail": false  # Optional, for testing
        }
    
    Body (Razorpay):
        {
            "razorpay_order_id": "order_...",
            "razorpay_payment_id": "pay_...",
            "razorpay_signature": "..."
        }
    
    Returns:
        {
            "success": true,
            "payment_id": "MOCK_PAY_...",
            "booking_id": 123,
            "booking_type": "session",
            "payment_status": "PAID",
            "paid_amount": 5000.00,
            "remaining_balance": 0.00
        }
    """
    try:
        # Get order_id (could be 'order_id' for mock, 'razorpay_order_id', or a SumUp checkout reference)
        order_id = request.data.get('order_id') or request.data.get('razorpay_order_id')
        
        if not order_id:
            return Response(
                {'error': 'order_id or razorpay_order_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # A Go Kids Play checkout reference (e.g. GK482913-7F3A or an older SP-…) → the checkout ID
        from .models import Payment
        if not Payment.objects.filter(order_id=order_id).exists():
            payment = Payment.objects.filter(provider_response__checkout_reference=order_id).first()
            if payment:
                order_id = payment.order_id
        
        # Verify payment
        result = payment_service.verify_and_complete_payment(
            order_id=order_id,
            payment_data=request.data
        )
        
        return Response(result)
        
    except ValueError as e:
        logger.error(f"Validation error verifying payment: {str(e)}")
        return Response(
            {'success': False, 'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        return Response(
            {'success': False, 'error': f'Failed to verify payment: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsStaffUser])  # Only staff can refund
def process_refund(request):
    """
    Process a refund.
    
    POST /api/payments/refund
    
    Body:
        {
            "payment_id": 123,
            "amount": 2500.00,  # Optional, defaults to full refund
            "reason": "Customer requested refund"  # Optional
        }
    
    Returns:
        {
            "success": true,
            "refund_id": "MOCK_REFUND_...",
            "amount": 2500.00,
            "booking_id": 123,
            "payment_status": "PARTIAL"
        }
    """
    try:
        payment_id = request.data.get('payment_id')
        amount = request.data.get('amount')
        reason = request.data.get('reason', '')
        
        if not payment_id:
            return Response(
                {'error': 'payment_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert amount if provided
        if amount is not None:
            try:
                amount = Decimal(str(amount))
            except (InvalidOperation, ValueError):
                return Response(
                    {'error': 'Invalid amount format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Process refund
        result = payment_service.process_refund(  # type: ignore[misc]
            payment_id=int(payment_id),
            amount=amount,
            reason=reason
        )
        
        return Response(result)
        
    except ValueError as e:
        logger.error(f"Validation error processing refund: {str(e)}")
        return Response(
            {'success': False, 'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error processing refund: {str(e)}")
        return Response(
            {'success': False, 'error': f'Failed to process refund: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsStaffUser])  # Admin payment history card (lists order ids)
def get_booking_payment_status(request, booking_id, booking_type):
    """
    Get payment status for a booking.
    
    GET /api/payments/booking/{booking_id}/{booking_type}/status
    
    Returns:
        {
            "booking_id": 123,
            "booking_type": "session",
            "total_amount": 5000.00,
            "paid_amount": 2500.00,
            "remaining_balance": 2500.00,
            "payment_status": "PARTIAL",
            "payments": [...]
        }
    """
    try:
        if booking_type not in ['session', 'party']:
            return Response(
                {'error': 'booking_type must be "session" or "party"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = payment_service.get_booking_payment_status(
            booking_id=int(booking_id),
            booking_type=booking_type
        )
        
        return Response(result)
        
    except ValueError as e:
        logger.error(f"Error getting payment status: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error getting payment status: {str(e)}")
        return Response(
            {'error': f'Failed to get payment status: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsStaffUser])  # Only staff can view stats
def get_payment_stats(request):
    """
    Get payment statistics and analytics.
    
    GET /api/payments/stats
    
    Returns comprehensive payment analytics including:
    - Total payments, successful, failed, refunds
    - Revenue metrics (total, today, week, month)
    - Average transaction value
    - Success rate
    - Recent payments
    - Payment methods breakdown
    - Daily revenue trend
    """
    try:
        from .models import Payment
        from apps.bookings.models import Booking
        from django.db.models import Sum, Count, Q, Avg
        from django.utils import timezone
        from datetime import timedelta
        
        # Get all payments
        all_payments = Payment.objects.all()  # type: ignore[attr-defined]
        
        # Basic counts
        total_payments = all_payments.count()
        successful_payments = all_payments.filter(status='SUCCESS', amount__gt=0).count()
        failed_payments = all_payments.filter(status='FAILED').count()
        total_refunds = all_payments.filter(amount__lt=0).count()
        
        # Revenue calculations (only successful payments with positive amounts)
        successful_payment_qs = all_payments.filter(status='SUCCESS', amount__gt=0)
        total_revenue = successful_payment_qs.aggregate(total=Sum('amount'))['total'] or 0
        
        # Time-based revenue
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)
        
        today_revenue = successful_payment_qs.filter(
            created_at__gte=today_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        this_week_revenue = successful_payment_qs.filter(
            created_at__gte=week_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        this_month_revenue = successful_payment_qs.filter(
            created_at__gte=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Average transaction value
        avg_transaction = successful_payment_qs.aggregate(avg=Avg('amount'))['avg'] or 0
        
        # Success rate
        success_rate = (successful_payments / total_payments * 100) if total_payments > 0 else 0
        
        # Payment methods breakdown
        payment_methods = {
            'STRIPE': all_payments.filter(provider='STRIPE').count(),
            'MOCK': all_payments.filter(provider='MOCK').count(),
        }
        
        # Recent payments (last 10)
        recent_payments_qs = all_payments.select_related(
            'booking'
        ).order_by('-created_at')[:10]
        
        recent_payments = []
        for payment in recent_payments_qs:
            booking_info = None
            if payment.booking:
                booking_info = {
                    'id': payment.booking.id,
                    'type': 'session',
                    'name': payment.booking.name,
                    'email': payment.booking.email,
                    'date': payment.booking.date.isoformat() if payment.booking.date else None,
                }
            
            recent_payments.append({
                'id': payment.id,
                'order_id': payment.order_id,
                'payment_id': payment.payment_id,
                'amount': float(payment.amount),
                'status': payment.status,
                'provider': payment.provider,
                'created_at': payment.created_at.isoformat(),
                'booking': booking_info
            })
        
        # Daily revenue for last 7 days
        daily_revenue = []
        for i in range(6, -1, -1):
            day_start = today_start - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            day_revenue = successful_payment_qs.filter(
                created_at__gte=day_start,
                created_at__lt=day_end
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            daily_revenue.append({
                'date': day_start.strftime('%Y-%m-%d'),
                'revenue': float(day_revenue)
            })
        
        return Response({
            'total_payments': total_payments,
            'successful_payments': successful_payments,
            'failed_payments': failed_payments,
            'total_refunds': total_refunds,
            'total_revenue': float(total_revenue),
            'today_revenue': float(today_revenue),
            'this_week_revenue': float(this_week_revenue),
            'this_month_revenue': float(this_month_revenue),
            'avg_transaction_value': float(avg_transaction),
            'success_rate': round(success_rate, 2),
            'payment_methods': payment_methods,
            'recent_payments': recent_payments,
            'daily_revenue': daily_revenue
        })
        
    except Exception as e:
        logger.error(f"Error getting payment stats: {str(e)}")
        return Response(
            {'error': f'Failed to get payment stats: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsStaffUser])
def list_payments(request):
    """
    List all payments with optional filtering.
    
    GET /api/payments/
    
    Query params:
        - status: Filter by status (SUCCESS, FAILED, CREATED, REFUNDED)
        - provider: Filter by provider (MOCK, RAZORPAY)
        - search: booking number (GK482913), customer name / email, order or transaction id
        - limit: Number of results (default: 100)
        - offset: Pagination offset (default: 0)
    
    Returns:
        {
            "count": 10,
            "results": [...]
        }
    """
    try:
        from .models import Payment
        from .serializers import PaymentSerializer
        
        # Get query parameters
        status_filter = request.query_params.get('status')
        provider_filter = request.query_params.get('provider')
        limit = int(request.query_params.get('limit', 100))
        offset = int(request.query_params.get('offset', 0))
        
        # Build query
        queryset = Payment.objects.all().select_related('booking', 'party_booking')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if provider_filter:
            queryset = queryset.filter(provider=provider_filter)

        search = (request.query_params.get('search') or '').strip()
        if search:
            from django.db.models import Q
            from apps.bookings.references import normalise_reference
            ref = normalise_reference(search)
            query = (
                Q(order_id__icontains=search) | Q(payment_id__icontains=search) |
                Q(booking__booking_number__icontains=ref) | Q(party_booking__booking_number__icontains=ref) |
                Q(booking__name__icontains=search) | Q(booking__email__icontains=search) |
                Q(party_booking__name__icontains=search) | Q(party_booking__email__icontains=search)
            )
            if search.isdigit():
                query |= Q(id=int(search)) | Q(booking_id=int(search)) | Q(party_booking_id=int(search))
            queryset = queryset.filter(query)
        
        # Order by most recent first
        queryset = queryset.order_by('-created_at')
        
        # Get total count
        total_count = queryset.count()
        
        # Apply pagination
        payments = queryset[offset:offset + limit]
        
        # Serialize
        serializer = PaymentSerializer(payments, many=True)
        
        return Response({
            'count': total_count,
            'results': serializer.data
        })
        
    except Exception as e:
        logger.error(f"Error listing payments: {str(e)}")
        return Response(
            {'error': f'Failed to list payments: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])  # SumUp calls this server-to-server
def sumup_webhook(request):
    """
    SumUp webhook — called server-to-server by SumUp after payment.
    SumUp sends: { "id": "<checkout_id>", "status": "PAID"|"FAILED" }
    This updates the booking status WITHOUT requiring a browser redirect.
    Register this URL in your SumUp merchant dashboard as the webhook endpoint.
    """
    try:
        data = request.data
        # SumUp may send the checkout id in different fields depending on event type
        checkout_id = data.get('id') or data.get('checkout_id')
        sumup_status = (data.get('status') or '').upper()

        logger.info(f"SumUp webhook received: checkout={checkout_id} status={sumup_status} data={data}")

        if not checkout_id:
            return Response({'error': 'Missing checkout id'}, status=status.HTTP_400_BAD_REQUEST)

        if sumup_status in ('PAID', 'SUCCESSFUL'):
            # Verify by polling SumUp API to confirm the status is authentic
            result = payment_service.verify_and_complete_payment(
                order_id=checkout_id,
                payment_data={'order_id': checkout_id}
            )
            logger.info(f"Webhook verify result for {checkout_id}: {result}")
            return Response({'received': True, 'result': result})

        elif sumup_status in ('FAILED', 'EXPIRED'):
            # Mark payment as failed
            try:
                from .models import Payment
                payment = Payment.objects.get(order_id=checkout_id)  # type: ignore[attr-defined]
                if payment.status not in ('SUCCESS', 'REFUNDED'):
                    payment.mark_failed(f'SumUp webhook: {sumup_status}')
                    logger.info(f"Payment {checkout_id} marked FAILED via webhook")
            except Payment.DoesNotExist:  # type: ignore[attr-defined, misc]
                logger.warning(f"Webhook: payment record not found for checkout {checkout_id}")
            return Response({'received': True})

        # Unknown status — just acknowledge receipt
        return Response({'received': True, 'status': sumup_status})

    except Exception as e:
        logger.error(f"SumUp webhook error: {e}")
        # Always return 200 to SumUp so it does not keep retrying
        return Response({'received': True, 'error': str(e)})


@api_view(['POST'])
@permission_classes([IsStaffUser])  # Admin → Payments "re-check" button
def reverify_payment(request, order_id):
    """
    Admin endpoint to manually re-verify a stuck PENDING payment.
    POST /api/v1/payments/reverify/<order_id>/
    Polls SumUp to check the real status and updates the booking if paid.
    """
    try:
        result = payment_service.verify_and_complete_payment(
            order_id=order_id,
            payment_data={'order_id': order_id}
        )
        return Response(result)
    except Exception as e:
        logger.error(f"Re-verify error for {order_id}: {e}")
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def auto_verify_pending_payments(request):
    """
    AUTO-SWEEP: Verify all SUMUP payments that are still in CREATED status.

    POST /api/v1/payments/auto-verify/
    Called automatically from:
      - The success page after every SumUp redirect (ensures the DB is updated
        even if the user's browser closed before the verify loop finished)
      - The admin payments page on load (sweeps any stale records)

    Returns a summary of how many payments were resolved.

    Anyone can call it (the success page does), so it runs at most once a
    minute; each run can ask SumUp about up to 50 payments.
    """
    from .models import Payment
    from django.core.cache import cache
    from django.utils import timezone
    from datetime import timedelta

    if not cache.add('payments:auto-verify', True, timeout=60):
        return Response({'success': True, 'skipped': True, 'detail': 'Checked less than a minute ago'})

    # Only look at SUMUP payments created in last 7 days that are still CREATED (limit to 50 to prevent timeouts)
    cutoff = timezone.now() - timedelta(days=7)
    pending_payments = list(Payment.objects.filter(  # type: ignore[attr-defined]
        provider='SUMUP',
        status='CREATED',
        created_at__gte=cutoff,
    ).order_by('-created_at')[:50])

    total = len(pending_payments)
    resolved = 0
    paid_count = 0
    failed_count = 0
    still_pending = 0
    errors = []

    logger.info(f"[AutoVerify] Starting sweep of {total} pending SUMUP payments")

    for payment in pending_payments:
        try:
            result = payment_service.verify_and_complete_payment(
                order_id=payment.order_id,
                payment_data={'order_id': payment.order_id}
            )
            if result.get('success'):
                resolved += 1
                if result.get('payment_status') == 'PAID':
                    paid_count += 1
                    logger.info(f"[AutoVerify] ✅ Payment {payment.order_id} → PAID")
                else:
                    still_pending += 1
            else:
                # SumUp says FAILED/EXPIRED
                err_msg = result.get('error', '')
                if 'failed' in err_msg.lower() or 'expired' in err_msg.lower():
                    failed_count += 1
                else:
                    still_pending += 1
        except Exception as e:
            logger.error(f"[AutoVerify] Error verifying {payment.order_id}: {e}")
            errors.append({'order_id': payment.order_id, 'error': str(e)})

    logger.info(
        f"[AutoVerify] Sweep complete: {total} total, "
        f"{paid_count} newly paid, {still_pending} still pending, "
        f"{failed_count} failed, {len(errors)} errors"
    )

    return Response({
        'success': True,
        'total_checked': total,
        'newly_paid': paid_count,
        'still_pending': still_pending,
        'failed': failed_count,
        'errors': errors,
    })

@api_view(['GET'])
@permission_classes([IsStaffUser])
def get_payment(request, payment_id):
    """
    Get a single payment by ID.
    """
    try:
        from .models import Payment
        from .serializers import PaymentSerializer
        payment = Payment.objects.get(id=payment_id)  # type: ignore[attr-defined]
        serializer = PaymentSerializer(payment)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_404_NOT_FOUND
        )


def mock_checkout(request, order_id):
    """
    Test checkout page for PAYMENT_MODE=mock (DEBUG only) — stands in for SumUp's
    hosted checkout. "Pay" or "Decline", then back to the website like SumUp.
    """
    from html import escape
    from urllib.parse import urlencode
    from django.conf import settings
    from django.http import Http404, HttpResponse, HttpResponseRedirect
    from .gateways.mock import frontend_return_url
    from .models import Payment

    if str(getattr(settings, 'PAYMENT_MODE', '')).lower() != 'mock' or not settings.DEBUG:
        raise Http404()
    try:
        payment = Payment.objects.get(order_id=order_id, provider='MOCK')
    except Payment.DoesNotExist:
        raise Http404()
    data = payment.provider_response or {}
    booking = payment.get_booking()

    if request.method == 'POST':
        result = 'PAID' if request.POST.get('result') == 'pay' else 'FAILED'
        payment.provider_response = {**data, 'mock_status': result}
        payment.save(update_fields=['provider_response'])
        params = urlencode({'booking_id': booking.id, 'booking_type': data.get('booking_type', 'session'),
                            'reference': data.get('checkout_reference', ''), 'order_id': order_id,
                            'mock': 'true', 'status': result})
        return HttpResponseRedirect(f"{frontend_return_url()}?{params}")

    from django.middleware.csrf import get_token
    token = get_token(request)
    page = f"""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Test payment</title><style>
body{{font-family:system-ui,sans-serif;background:#f1f5f9;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}}
.card{{background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.08);padding:32px;max-width:420px;width:90%}}
.tag{{background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;padding:4px 10px;border-radius:99px;display:inline-block}}
h1{{font-size:22px;margin:14px 0 4px}} .amount{{font-size:36px;font-weight:800;margin:12px 0}}
button{{width:100%;padding:14px;border:0;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;margin-top:10px}}
.pay{{background:#16a34a;color:#fff}} .decline{{background:#e2e8f0;color:#334155}} p{{color:#64748b;font-size:14px}}
</style></head><body><div class="card">
<span class="tag">TEST MODE — no money is taken</span>
<h1>Go Kids Play</h1><p>Booking {escape(str(booking.booking_number or booking.id))} · {escape(booking.name)}</p>
<div class="amount">£{payment.amount:,.2f}</div>
<form method="post"><input type="hidden" name="csrfmiddlewaretoken" value="{token}">
<button class="pay" name="result" value="pay" type="submit">Pay £{payment.amount:,.2f}</button>
<button class="decline" name="result" value="decline" type="submit">Decline (test a failed payment)</button>
</form><p>This page replaces SumUp while PAYMENT_MODE=mock.</p></div></body></html>"""
    return HttpResponse(page)
