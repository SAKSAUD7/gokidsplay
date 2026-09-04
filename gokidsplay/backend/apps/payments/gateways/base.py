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
