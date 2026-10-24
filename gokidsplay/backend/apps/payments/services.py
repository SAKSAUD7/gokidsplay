"""
Payment Service Layer.

Handles all payment-related business logic including:
- Creating payment orders
- Verifying payments
- Processing refunds
- Updating booking payment status
- Sending email notifications

This service uses the payment gateway factory to work with any provider.
"""

import logging
from decimal import Decimal
from typing import Dict, Any, Optional
from django.db import transaction
from django.conf import settings

from .gateways.factory import get_gateway_instance
from .models import Payment
from apps.bookings.models import Booking, PartyBooking
from apps.emails.services import email_service

logger = logging.getLogger(__name__)


class PaymentService:
    """
    Service for managing payments across all booking types.
    
    Uses payment gateway factory to support multiple providers.
    Handles all payment-related business logic and state management.
    """
    
    def __init__(self):
        """Initialize payment service"""
        self.gateway = get_gateway_instance()
        logger.info(f"PaymentService initialized with {self.gateway.get_provider_name()} gateway")
    
    def get_booking(self, booking_id: int, booking_type: str):
        """
        Get booking instance by ID and type.
        
        Args:
            booking_id: Booking ID
            booking_type: 'session' or 'party'
        
        Returns:
            Booking or PartyBooking instance
        
        Raises:
            ValueError: If booking not found or invalid type
        """
        if booking_type == 'session':
            try:
                return Booking.objects.get(id=booking_id)
            except Booking.DoesNotExist:
                raise ValueError(f"Session booking {booking_id} not found")
        
        elif booking_type == 'party':
            try:
                return PartyBooking.objects.get(id=booking_id)
            except PartyBooking.DoesNotExist:
                raise ValueError(f"Party booking {booking_id} not found")
        
        else:
            raise ValueError(f"Invalid booking type: {booking_type}")
    
    @transaction.atomic
    def create_payment_order(
        self,
        booking_id: int,
        booking_type: str,
        amount: Optional[Decimal] = None
    ) -> Dict[str, Any]:
        """
        Create a payment order.
        
        Args:
            booking_id: Booking ID
            booking_type: 'session' or 'party'
            amount: Payment amount (if None, use full booking amount)
        
        Returns:
            Dict with order details from gateway
        
        Raises:
            ValueError: If validation fails
            Exception: If order creation fails
        """
        # Get booking
        booking = self.get_booking(booking_id, booking_type)

        # The server decides what is charged (never the amount the browser sends):
        #   session → the balance due; party → the deposit (first payment) or the balance
        status_field = 'status' if booking_type == 'party' else 'booking_status'
        if getattr(booking, status_field, '') == 'CANCELLED':
            raise ValueError("This booking has been cancelled or has expired. Please make a new booking.")
        if booking.payment_status == 'PAID' or booking.remaining_balance <= 0:
            raise ValueError("This booking has already been paid in full.")
        requested = Decimal(str(amount)) if amount is not None else None
        amount = booking.remaining_balance
        if booking_type == 'party' and requested is not None and (booking.paid_amount or 0) <= 0:
            deposit = Decimal(str(booking.deposit_amount or 0))
            if deposit > 0 and abs(requested - deposit) < Decimal('0.01'):
                amount = deposit
        if amount <= 0:
            raise ValueError("Payment amount must be positive")

        logger.info(f"Creating payment order for {booking_type} booking {booking_id}: £{amount}")

        # Create order via gateway
        order_data = self.gateway.create_order(booking, amount)

        logger.info(f"Payment order created: {order_data.get('order_id')}")

        return order_data
    
    def verify_and_complete_payment(
        self,
        order_id: str,
        payment_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Verify payment and complete the transaction.
        
        Args:
            order_id: Order ID from create_payment_order
            payment_data: Provider-specific verification data
        
        Returns:
            Dict with verification result and booking status
        
        Raises:
            ValueError: If payment not found
            Exception: If verification fails
        """
        logger.info(f"Verifying payment for order: {order_id}")
        
        # Add order_id to payment_data if not present
        if 'order_id' not in payment_data:
            payment_data['order_id'] = order_id
        
        # Verify payment via gateway
        success, payment_id, response = self.gateway.verify_payment(payment_data)
        
        if not success:
            failed = str(response.get('status', '')).upper() in ('FAILED', 'EXPIRED')
            logger.info(f"Payment {order_id} not paid ({response.get('status', 'unknown')})")
            return {
                'success': False,
                'error': response.get('error', 'Payment verification failed'),
                # The success page shows "payment failed" straight away instead of waiting
                **({'payment_status': 'FAILED'} if failed else {'payment_status': 'PENDING'}),
                'response': response,
            }
        
        # Get payment record
        payment = Payment.objects.get(order_id=order_id)
        booking = payment.get_booking()
        
        logger.info(f"Payment verified successfully: {order_id} → {payment_id}")
        logger.info(f"Booking {booking.id} status: {booking.payment_status} (£{booking.paid_amount}/£{booking.amount})")
        
        # E-mails: customer confirmation / receipt + a notice to the team. Sent once per
        # payment even though the success page and SumUp's webhook both verify it.
        try:
            from apps.emails.notifications import payment_received
            payment_received(booking, payment)
        except Exception as e:
            logger.error(f"Failed to send payment email: {str(e)}")
            # Don't fail the payment if email fails
        
        return {
            'success': True,
            'payment_id': payment_id,
            'order_id': order_id,
            'booking_id': booking.id,
            'booking_type': 'party' if isinstance(booking, PartyBooking) else 'session',
            'payment_status': booking.payment_status,
            'paid_amount': float(booking.paid_amount),
            'remaining_balance': float(booking.remaining_balance),
            'response': response,
        }
    
    @staticmethod
    def record_venue_payment(booking, amount, recorded_by: str = '', note: str = ''):
        """
        Staff took the money at the desk (cash or card). Saved as a Payment so it shows in
        Admin → Payments and the revenue figures next to the online (SumUp) payments.
        """
        import uuid
        from apps.bookings.models import PartyBooking as _PartyBooking
        amount = Decimal(str(amount or 0))
        if amount <= 0:
            return None
        link = {'party_booking': booking} if isinstance(booking, _PartyBooking) else {'booking': booking}
        reference = booking.booking_number or f"#{booking.id}"
        return Payment.objects.create(
            **link,
            provider='VENUE',
            order_id=f"VENUE-{reference}-{uuid.uuid4().hex[:6].upper()}",
            payment_id=f"VENUE-{uuid.uuid4().hex[:10].upper()}",
            amount=amount,
            currency='GBP',
            status='SUCCESS',
            notes=' · '.join(filter(None, [note or 'Paid at the venue', f'recorded by {recorded_by}' if recorded_by else ''])),
        )

    @transaction.atomic
    def process_refund(
        self,
        payment_id: int,
        amount: Optional[Decimal] = None,
        reason: str = ''
    ) -> Dict[str, Any]:
        """
        Process a refund for a payment.
        
        Args:
            payment_id: Payment ID to refund
            amount: Refund amount (if None, refund full payment)
            reason: Reason for refund (for notes)
        
        Returns:
            Dict with refund details
        
        Raises:
            ValueError: If payment not found or validation fails
            Exception: If refund fails
        """
        # Get payment
        try:
            payment = Payment.objects.get(id=payment_id)
        except Payment.DoesNotExist:
            raise ValueError(f"Payment {payment_id} not found")
        
        # Validate payment can be refunded
        if payment.status != 'SUCCESS':
            raise ValueError(f"Cannot refund payment with status {payment.status}")
        
        if payment.is_refund():
            raise ValueError("Cannot refund a refund payment")
        
        logger.info(f"Processing refund for payment {payment_id}: £{amount or payment.amount}")
        
        # Process refund via gateway
        refund_data = self.gateway.refund(payment, amount)
        
        # Get updated booking
        booking = payment.get_booking()
        
        logger.info(f"Refund processed: {refund_data.get('refund_id')}")
        logger.info(f"Booking {booking.id} status after refund: {booking.payment_status} (£{booking.paid_amount})")
        
        # Send refund email
        try:
            self._send_refund_email(booking, refund_data, reason)
        except Exception as e:
            logger.error(f"Failed to send refund email: {str(e)}")
        
        return {
            'success': True,
            'refund_id': refund_data.get('refund_id'),
            'amount': refund_data.get('amount'),
            'booking_id': booking.id,
            'booking_type': 'party' if isinstance(booking, PartyBooking) else 'session',
            'payment_status': booking.payment_status,
            'paid_amount': float(booking.paid_amount),
            'refund_data': refund_data,
        }
    
    def get_booking_payment_status(
        self,
        booking_id: int,
        booking_type: str
    ) -> Dict[str, Any]:
        """
        Get payment status for a booking.
        
        Args:
            booking_id: Booking ID
            booking_type: 'session' or 'party'
        
        Returns:
            Dict with payment status details
        """
        booking = self.get_booking(booking_id, booking_type)
        
        # Get all payments for this booking
        if booking_type == 'session':
            payments = Payment.objects.filter(booking=booking).order_by('-created_at')
        else:
            payments = Payment.objects.filter(party_booking=booking).order_by('-created_at')
        
        payment_list = [
            {
                'id': p.id,
                'order_id': p.order_id,
                'payment_id': p.payment_id,
                'amount': float(p.amount),
                'status': p.status,
                'provider': p.provider,
                'created_at': p.created_at.isoformat(),
                'is_refund': p.is_refund(),
            }
            for p in payments
        ]
        
        return {
            'booking_id': booking.id,
            'booking_type': booking_type,
            'total_amount': float(booking.amount),
            'paid_amount': float(booking.paid_amount),
            'remaining_balance': float(booking.remaining_balance),
            'payment_status': booking.payment_status,
            'payments': payment_list,
        }
    
    def _send_payment_success_email(self, booking, payment):
        """Send full payment success email - triggers booking confirmation"""
        logger.info(f"Sending payment success email for booking {booking.id}")
        
        try:
            from django.conf import settings
            from apps.bookings.models import PartyBooking
            
            # Trigger confirmation email for successful or 'pending' payment logic
            if isinstance(booking, PartyBooking):
                # Party booking confirmation
                from apps.emails.tasks import send_party_booking_confirmation_email
                logger.info(f"Sending party booking confirmation email for booking {booking.id}")
                send_party_booking_confirmation_email(booking.id)
            else:
                # Session booking confirmation
                from apps.emails.tasks import send_booking_confirmation_email
                logger.info(f"Sending session booking confirmation email for booking {booking.id}")
                send_booking_confirmation_email(booking.id)
                
            logger.info(f"Booking confirmation email queued successfully for booking {booking.id}")
            
        except Exception as e:
            logger.error(f"Failed to send booking confirmation email for booking {booking.id}: {str(e)}", exc_info=True)
            # Don't fail the payment if email fails
    
    def _send_partial_payment_email(self, booking, payment):
        """Send partial payment received email"""
        logger.info(f"Sending partial payment email for booking {booking.id}")
        # For partial payments, we can send a different email template in the future
        # For now, just log it
        pass
    
    def _send_refund_email(self, booking, refund_data, reason):
        """Tell the customer (and the team) that the refund is on its way."""
        from apps.emails.notifications import refund_issued
        refund_issued(booking, refund_data.get('amount') or 0, reason)


# Singleton instance
payment_service = PaymentService()
