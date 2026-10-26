"""
SumUp Payment Gateway Integration for Go Kids Play.

All payments go to the one Go Kids Play merchant account
(SUMUP_API_KEY / SUMUP_MERCHANT_CODE in .env).

Uses SumUp Checkout API (hosted redirect flow):
  1. Call /checkouts to create a checkout → get checkout_id
  2. Redirect customer to https://checkout.sumup.com/one/checkout?token={checkout_id}
  3. SumUp redirects back to /book/success?checkout_id={id}&status=paid|failed
  4. Call /checkouts/{id} to verify final status server-side

Docs: https://developer.sumup.com/api/checkouts/
"""

import logging
import uuid
import requests  # type: ignore[import-untyped]
from decimal import Decimal
from typing import Tuple, Dict, Any, Optional

from django.conf import settings  # type: ignore[import-untyped]

from .base import BasePaymentGateway, apply_refund, apply_successful_payment
from ..models import Payment

logger = logging.getLogger(__name__)

SUMUP_API_BASE = "https://api.sumup.com/v0.1"

ACCOUNT_NAME = "Go Kids Play Ltd"


def _get_merchant_credentials(activity: Optional[str] = None) -> Dict[str, str]:
    """
    Return the SumUp credentials. Go Kids Play has a single merchant account, so
    every booking (session, party, any activity) is paid into it. The activity
    argument is kept for callers that still pass it.
    """
    return {
        "api_key":       getattr(settings, "SUMUP_API_KEY", ""),
        "merchant_code": getattr(settings, "SUMUP_MERCHANT_CODE", ""),
        "account_name":  ACCOUNT_NAME,
    }


class SumUpGateway(BasePaymentGateway):
    """
    SumUp Checkout API gateway (single Go Kids Play merchant account).
    """

    def __init__(self):
        """
        Base (single-activity) initialization — kept for backward compatibility
        with the factory singleton. The actual credentials are resolved per-order
        inside create_order() using the booking's activity field.
        """
        # Build the return URL from explicit setting, or derive from FRONTEND_URL env var.
        # This ensures SumUp redirects back to the live site even if SUMUP_RETURN_URL is not set.
        explicit = getattr(settings, "SUMUP_RETURN_URL", "")
        if explicit and "localhost" not in explicit:
            self.return_url = explicit
        else:
            frontend_url = (
                getattr(settings, "FRONTEND_URL", "")
                or getattr(settings, "NEXT_PUBLIC_FRONTEND_URL", "")
                or "http://localhost:5000"
            )
            self.return_url = f"{frontend_url.rstrip('/')}/book/success"
        logger.info(f"SumUp gateway initialized. Return URL: {self.return_url}")

    def get_provider_name(self) -> str:
        return "sumup"

    def _headers(self, api_key: str) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def create_order(self, booking, amount: Decimal | None = None) -> Dict[str, Any]:
        """
        Create a SumUp checkout for this booking.

        Returns dict with:
          - order_id:     the checkout_id from SumUp
          - checkout_url: URL to redirect customer to
          - provider:     'sumup'
          - merchant:     the merchant account name
          - amount, currency
        """
        from apps.bookings.models import PartyBooking

        is_party    = isinstance(booking, PartyBooking)
        booking_type = "party" if is_party else "session"

        # ── Select merchant credentials from activity ─────────────────────────
        activity = getattr(booking, "activity", None) or ""
        creds    = _get_merchant_credentials(activity)
        api_key       = creds["api_key"]
        merchant_code = creds["merchant_code"]
        account_name  = creds["account_name"]

        if not api_key:
            raise Exception(
                f"SumUp API key not configured for {account_name}. "
                f"Please set SUMUP_API_KEY in .env"
            )
        if not merchant_code:
            raise Exception(
                f"SumUp Merchant Code not configured for {account_name}. "
                f"Please set SUMUP_MERCHANT_CODE in .env"
            )

        logger.info(
            f"SumUp: Using {account_name} account for "
            f"{booking_type} booking #{booking.id} (activity: '{activity}')"
        )

        # ── Build checkout payload ────────────────────────────────────────────
        # Starts with the booking number (e.g. GK482913-7F3A9C) so the payment can be
        # found in the SumUp dashboard and in Admin → Payments by booking number
        reference = f"{booking.booking_number or f'GKP-{booking.id}'}-{uuid.uuid4().hex[:6].upper()}"

        # Build a concise description with key booking info for SumUp tracking
        booking_date_obj = getattr(booking, 'date', None)
        date_formatted = booking_date_obj.strftime("%d.%m") if booking_date_obj else ""
        booking_time = str(getattr(booking, 'time', ''))[:5] if hasattr(booking, 'time') else ''
        
        adults = getattr(booking, 'adults', 0) or 0
        kids = getattr(booking, 'kids', 0) or 0
        total_people = adults + kids
        
        description = f"{booking.booking_number or booking.id} | {date_formatted} | {total_people}P | {booking_time}"
        return_url_str = (
            f"{self.return_url}"
            f"?booking_id={booking.uuid}"   # the private e-ticket id (the ticket page looks it up by this)
            f"&booking_type={booking_type}"
            f"&reference={reference}"
        )

        # SumUp tells this backend about the payment here (BACKEND_URL, e.g. https://api.gokidsplay.co.uk).
        # Only a public https address can receive it; on a PC the success page checks the payment instead.
        backend_url = str(getattr(settings, 'BACKEND_URL', '') or '').rstrip('/')
        webhook_url = f"{backend_url}/api/v1/payments/sumup-webhook/"             if backend_url.startswith('https://') and 'localhost' not in backend_url else None

        payload = {
            "checkout_reference": reference,
            "amount":            float(amount or 0),
            "currency":          "GBP",
            "merchant_code":     merchant_code,
            "description":       description,
            **({"return_url": webhook_url} if webhook_url else {}),  # webhook
            # Where SumUp sends the customer afterwards: the "back to Go Kids Play" button on its
            # page, and 3-D Secure returns. Must be top-level (SumUp ignores it inside hosted_checkout).
            "redirect_url":      return_url_str,
            # Also a SumUp-hosted page, used if the card form on our own page can't load
            "hosted_checkout": {"enabled": True},
        }

        try:
            resp = requests.post(
                f"{SUMUP_API_BASE}/checkouts",
                json=payload,
                headers=self._headers(api_key),
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
        except requests.RequestException as e:
            logger.error(f"SumUp create_order failed ({account_name}): {e}")
            try:
                if getattr(e, 'response', None) is not None:
                    logger.error(f"SumUp error response: {e.response.text}") # type: ignore
            except:
                pass
            raise Exception(f"SumUp checkout creation failed: {e}")

        checkout_id = data.get("id")
        if not checkout_id:
            raise Exception(f"SumUp returned no checkout ID: {data}")

        # ── Save Payment record ───────────────────────────────────────────────
        payment_kwargs = {"booking": booking} if not is_party else {"party_booking": booking}
        Payment.objects.create(  # type: ignore[attr-defined]
            **payment_kwargs,
            provider="SUMUP",
            order_id=checkout_id,
            amount=amount,
            currency="GBP",
            status="CREATED",
            provider_response={
                **data,
                "checkout_reference": reference,   # the customer comes back from SumUp with this
                "_merchant_account": account_name,
                "_activity": activity,
            },
        )

        # Use the hosted_checkout_url provided by the API, fallback to pay.sumup.com/b2c/
        checkout_url = data.get("hosted_checkout_url")
        if not checkout_url:
            checkout_url = f"https://pay.sumup.com/b2c/{checkout_id}"

        logger.info(
            f"SumUp checkout created: {checkout_id} "
            f"via {account_name} for {booking_type} booking {booking.id}"
        )

        return {
            "order_id":     checkout_id,
            "checkout_url": checkout_url,
            "provider":     "sumup",
            "merchant":     account_name,
            "amount":       float(amount) if amount is not None else 0.0,
            "currency":     "GBP",
            "reference":    reference,
        }

    def verify_payment(
        self, data: Dict[str, Any]
    ) -> Tuple[bool, str, Dict[str, Any]]:  # type: ignore[override]
        """
        Verify a SumUp checkout by polling /checkouts/{id}.

        payment_data must contain 'order_id' (the SumUp checkout ID).
        Returns (success, payment_id, response_dict).
        """
        checkout_id = data.get("order_id")
        if not checkout_id:
            return False, "", {"error": "Missing checkout ID"}

        # Look up which merchant processed this checkout from the stored Payment record
        api_key = self._get_api_key_for_checkout(checkout_id)

        try:
            resp = requests.get(
                f"{SUMUP_API_BASE}/checkouts/{checkout_id}",
                headers=self._headers(api_key),
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
        except requests.RequestException as e:
            logger.error(f"SumUp verify_payment failed: {e}")
            return False, "", {"error": str(e)}

        checkout_status = data.get("status", "").upper()
        logger.info(f"SumUp checkout {checkout_id} status: {checkout_status}")

        if checkout_status in ("PAID", "SUCCESSFUL"):
            transactions = data.get("transactions", [])
            tx_id = transactions[0].get("id") if transactions else checkout_id

            try:
                payment = Payment.objects.get(order_id=checkout_id)  # type: ignore[attr-defined]
                booking = apply_successful_payment(payment, tx_id, data)
                logger.info(f"Booking {booking.id} updated: payment_status={booking.payment_status}, "
                            f"paid_amount={booking.paid_amount}")
            except Payment.DoesNotExist:  # type: ignore[attr-defined]
                logger.warning(f"Payment record not found for checkout {checkout_id}")

            return True, tx_id, data

        elif checkout_status in ("FAILED", "EXPIRED"):
            try:
                payment = Payment.objects.get(order_id=checkout_id)  # type: ignore[attr-defined]
                payment.mark_failed(f"SumUp status: {checkout_status}")
            except Payment.DoesNotExist:  # type: ignore[attr-defined]
                pass
            return False, "", {
                "error": f"Checkout {checkout_status.lower()}",
                "status": checkout_status,
            }

        return False, "", {
            "status": checkout_status,
            "message": "Payment not yet completed",
        }

    def refund(
        self, payment: Payment, amount: Optional[Decimal] = None
    ) -> Dict[str, Any]:
        """
        Initiate a refund via SumUp API using the correct merchant API key.
        SumUp refunds are made against the transaction ID, not the checkout ID.
        """
        tx_id = payment.payment_id
        if not tx_id:
            raise ValueError("Cannot refund — no SumUp transaction ID on payment record")

        # Determine merchant from stored provider_response
        stored_response = payment.provider_response or {}
        activity = stored_response.get("_activity", "")  # type: ignore[attr-defined]
        creds = _get_merchant_credentials(activity)
        api_key = creds["api_key"]

        refund_amount = float(amount) if amount is not None else float(payment.amount)  # type: ignore[arg-type]

        try:
            resp = requests.post(
                f"{SUMUP_API_BASE}/me/refund/{tx_id}",
                json={"amount": refund_amount},
                headers=self._headers(api_key),
                timeout=15,
            )
            resp.raise_for_status()
            _ = resp.json() if resp.content else {}
        except requests.RequestException as e:
            logger.error(f"SumUp refund failed: {e}")
            raise Exception(f"SumUp refund failed: {e}")

        apply_refund(payment, Decimal(str(refund_amount)))

        logger.info(
            f"SumUp refund processed: £{refund_amount} for transaction {tx_id}"
        )

        return {
            "refund_id": f"refund-{tx_id}",
            "amount":    refund_amount,
            "currency":  "GBP",
            "status":    "REFUNDED",
        }

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _get_api_key_for_checkout(self, checkout_id: str) -> str:
        """API key used to verify or refund a checkout (single merchant account)."""
        return _get_merchant_credentials()["api_key"]
