"""
Base Payment Gateway Interface.

All payment gateways (Mock, Razorpay, etc.) must implement this interface.
This ensures consistent behavior across different payment providers.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple, Optional
from decimal import Decimal


class BasePaymentGateway(ABC):
    """
    Abstract base class for payment gateways.
    
    All payment providers must implement these methods to ensure
    consistent payment processing across the application.
    """
    
    @abstractmethod
    def create_order(self, booking, amount: Optional[Decimal] = None) -> Dict[str, Any]:
        """
        Create a payment order.
        
        Args:
            booking: Booking or PartyBooking instance
            amount: Payment amount (if None, use full booking amount)
        
        Returns:
            Dict containing:
                - order_id: Unique order identifier
                - amount: Order amount
                - currency: Currency code
                - provider: Provider name
                - Any additional provider-specific data
        
        Raises:
            Exception: If order creation fails
        """
        pass
    
    @abstractmethod
    def verify_payment(self, data: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Verify a payment transaction.
        
        Args:
            data: Payment verification data (provider-specific)
        
        Returns:
            Tuple of (success: bool, payment_id: str, response: dict)
                - success: True if payment verified successfully
                - payment_id: Unique payment identifier from provider
                - response: Full provider response data
        
        Raises:
            Exception: If verification fails
        """
        pass
    
    @abstractmethod
    def refund(self, payment, amount: Optional[Decimal] = None) -> Dict[str, Any]:
        """
        Process a refund.
        
        Args:
            payment: Payment instance to refund
            amount: Refund amount (if None, refund full payment amount)
        
        Returns:
            Dict containing:
                - refund_id: Unique refund identifier
                - amount: Refunded amount
                - status: Refund status
                - Any additional provider-specific data
        
        Raises:
            Exception: If refund fails
        """
        pass
    
    def get_provider_name(self) -> str:
        """
        Get the provider name.
        
        Returns:
            Provider name (e.g., 'MOCK', 'RAZORPAY')
        """
        return self.__class__.__name__.replace('Gateway', '').upper()


def apply_successful_payment(payment, tx_id: str, provider_response: Dict[str, Any]):
    """
    The card payment went through: mark the Payment successful and update the
    booking (paid amount, payment status, confirmed / deposit paid). Safe to call
    more than once for the same payment (the success page and the webhook both
    verify): the amount is only added the first time.
    """
    from apps.bookings.models import PartyBooking

    already_processed = payment.status == 'SUCCESS'
    payment.mark_success(payment_id=tx_id, provider_response=provider_response)

    booking = payment.get_booking()
    is_party = isinstance(booking, PartyBooking)
    if not already_processed:
        booking.paid_amount = (booking.paid_amount or Decimal('0')) + payment.amount

    if (booking.paid_amount or Decimal('0')) >= booking.amount:
        booking.payment_status = 'PAID'
        if is_party:
            booking.status = 'CONFIRMED'
        else:
            booking.booking_status = 'CONFIRMED'
    else:
        booking.payment_status = 'PARTIAL'
        if is_party:
            booking.status = 'DEPOSIT_PAID'

    if is_party:
        booking.save(update_fields=['paid_amount', 'payment_status', 'status'])
    else:
        booking.save(update_fields=['paid_amount', 'payment_status', 'booking_status'])
    return booking


def apply_refund(payment, refund_amount: Decimal):
    """Money went back to the card: mark the Payment refunded and reduce what the booking has paid."""
    payment.status = 'REFUNDED'
    payment.notes = f"Refunded £{refund_amount}"
    payment.save(update_fields=['status', 'notes'])
    booking = payment.get_booking()
    booking.paid_amount = max(Decimal('0'), (booking.paid_amount or Decimal('0')) - refund_amount)
    booking.payment_status = 'REFUNDED' if booking.paid_amount <= 0 else 'PARTIAL'
    booking.save(update_fields=['paid_amount', 'payment_status'])
    return booking
