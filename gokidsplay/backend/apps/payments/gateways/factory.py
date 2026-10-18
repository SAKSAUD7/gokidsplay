"""
Payment Gateway Factory.

Reads PAYMENT_MODE from settings:
  - 'sumup' (default) → SumUpGateway (live card payments)
  - 'mock'            → MockPaymentGateway (test checkout page; DEBUG only)
"""

import logging
from django.conf import settings
from .base import BasePaymentGateway
from .sumup import SumUpGateway

logger = logging.getLogger(__name__)

def get_payment_gateway() -> BasePaymentGateway:
    """
    SumUp (live card payments), or the mock gateway for testing when
    PAYMENT_MODE=mock — which only works while DEBUG is on, never on the live site.
    """
    mode = str(getattr(settings, 'PAYMENT_MODE', 'sumup') or 'sumup').lower()
    if mode == 'mock':
        if getattr(settings, 'DEBUG', False):
            from .mock import MockPaymentGateway
            logger.warning("Payment gateway: MOCK (test payments — no money is taken)")
            return MockPaymentGateway()
        logger.error("PAYMENT_MODE=mock ignored because DEBUG is off — using SumUp")
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

