"""
Payment Gateway Factory.

Reads PAYMENT_MODE from settings:
  - 'sumup'  → SumUpGateway  (live online payments)
  - anything else → MockPaymentGateway  (pay at venue, auto-confirms)

Set PAYMENT_MODE=sumup in .env when SumUp API keys are configured.
"""

import logging
from django.conf import settings
from .base import BasePaymentGateway
from .sumup import SumUpGateway

logger = logging.getLogger(__name__)

def get_payment_gateway() -> BasePaymentGateway:
    """
    Get the SumUp payment gateway.
    """
    logger.info("Payment gateway: SumUp (live online payments)")
    return SumUpGateway()


# Singleton instance for reuse
_gateway_instance = None


def get_gateway_instance() -> BasePaymentGateway:
    """
    Get singleton payment gateway instance.

    Returns:
        Cached BasePaymentGateway instance
    """
    global _gateway_instance
    if _gateway_instance is None:
        _gateway_instance = get_payment_gateway()
    return _gateway_instance


def reset_gateway_instance():
    """Reset singleton — useful when switching gateways in tests."""
    global _gateway_instance
    _gateway_instance = None

