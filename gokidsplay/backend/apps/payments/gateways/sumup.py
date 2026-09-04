"""
SumUp Payment Gateway Integration for SpinPin.

Dual-Merchant Setup:
  - Roller Skating & Arcade → SpinPin Ltd account (SUMUP_SKATING_*)
  - Ten Pin Bowling         → Twinkle Town Ltd account (SUMUP_BOWLING_*)

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

from .base import BasePaymentGateway
from ..models import Payment

logger = logging.getLogger(__name__)

SUMUP_API_BASE = "https://api.sumup.com/v0.1"

# Activities routed to Twinkle Town Ltd (bowling account)
BOWLING_ACTIVITIES = {"ten-pin-bowling", "bowling"}

# Activities routed to SpinPin Ltd (skating account)
SKATING_ACTIVITIES = {"roller-skating", "skating", "arcade"}


def _get_merchant_credentials(activity: Optional[str]) -> Dict[str, str]:
    """
    Return the correct SumUp credentials based on the booking activity.

    Routing logic:
      - ten-pin-bowling  → Twinkle Town Ltd (SUMUP_BOWLING_*)
      - roller-skating   → SpinPin Ltd     (SUMUP_SKATING_*)
      - arcade           → SpinPin Ltd     (SUMUP_SKATING_*)
      - unknown/None     → SpinPin Ltd     (SUMUP_SKATING_*) as default
    """
    activity_lower = (activity or "").lower().strip()

    if activity_lower in BOWLING_ACTIVITIES:
        api_key       = getattr(settings, "SUMUP_BOWLING_API_KEY", "")
        merchant_code = getattr(settings, "SUMUP_BOWLING_MERCHANT_CODE", "M7EN4CMZ")
        account_name  = "Twinkle Town Ltd"
    else:
        # Skating, Arcade, or default
        api_key       = getattr(settings, "SUMUP_SKATING_API_KEY", "")
        merchant_code = getattr(settings, "SUMUP_SKATING_MERCHANT_CODE", "")
        account_name  = "SpinPin Ltd"

    # Final fallback to legacy single-key settings
    if not api_key:
        api_key = getattr(settings, "SUMUP_API_KEY", "")
    if not merchant_code:
        merchant_code = getattr(settings, "SUMUP_MERCHANT_CODE", "")

    return {
        "api_key":      api_key,
        "merchant_code": merchant_code,
        "account_name": account_name,
    }


class SumUpGateway(BasePaymentGateway):
    """
    SumUp Checkout API gateway with dual-merchant support.

    The correct merchant credentials are selected automatically based on the
    booking's activity field:
      - roller-skating / arcade → SpinPin Ltd
      - ten-pin-bowling         → Twinkle Town Ltd
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
                or "https://spinpin-frontend-d7ftbvf8h8cxe9g5.centralus-01.azurewebsites.net"
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
        Create a SumUp checkout using the correct merchant account for this booking.

        Returns dict with:
          - order_id:     the checkout_id from SumUp
          - checkout_url: URL to redirect customer to
          - provider:     'sumup'
          - merchant:     which account was used ('SpinPin Ltd' or 'Twinkle Town Ltd')
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
                f"Please set SUMUP_SKATING_API_KEY / SUMUP_BOWLING_API_KEY in .env"
            )
        if not merchant_code:
            raise Exception(
                f"SumUp Merchant Code not configured for {account_name}. "
                f"Please set SUMUP_SKATING_MERCHANT_CODE / SUMUP_BOWLING_MERCHANT_CODE in .env"
            )

        logger.info(
            f"SumUp: Using {account_name} account for "
            f"{booking_type} booking #{booking.id} (activity: '{activity}')"
        )

        # ── Build checkout payload ────────────────────────────────────────────
        reference = f"SP-{booking.id}-{uuid.uuid4().hex[:8].upper()}"

        # Build a concise description with key booking info for SumUp tracking
        booking_date_obj = getattr(booking, 'date', None)
        date_formatted = booking_date_obj.strftime("%d.%m") if booking_date_obj else ""
        booking_time = str(getattr(booking, 'time', ''))[:5] if hasattr(booking, 'time') else ''
        
        adults = getattr(booking, 'adults', 0) or 0
        kids = getattr(booking, 'kids', 0) or 0
        total_people = adults + kids
        
        description = f"SP #{booking.id} | {date_formatted} | {total_people}P | {booking_time}"
        return_url_str = (
            f"{self.return_url}"
            f"?booking_id={booking.id}"
            f"&booking_type={booking_type}"
            f"&reference={reference}"
        )

        import os
        webhook_base = f"https://{os.environ.get('WEBSITE_HOSTNAME')}" if os.environ.get('WEBSITE_HOSTNAME') else "https://spinpin-backend-cfgcejczfpgyabd7.centralus-01.azurewebsites.net"
        webhook_url = f"{webhook_base}/api/v1/payments/sumup-webhook/"

        payload = {
            "checkout_reference": reference,
            "amount":            float(amount or 0),
            "currency":          "GBP",
            "merchant_code":     merchant_code,
            "description":       description,
            "return_url":        webhook_url, # Webhook sent here
            "hosted_checkout": {
                "enabled": True,
                "redirect_url": return_url_str # User redirected here
            }
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
                from apps.bookings.models import PartyBooking as _PartyBooking
                from decimal import Decimal

                payment = Payment.objects.get(order_id=checkout_id)  # type: ignore[attr-defined]

                # --- IDEMPOTENCY CHECK ---
                # Only accumulate paid_amount if this payment was NOT already marked SUCCESS.
                # This prevents double-counting when verify is called multiple times
                # (e.g. from the success page redirect AND from the SumUp webhook).
                already_processed = payment.status == "SUCCESS"

                payment.mark_success(payment_id=tx_id, provider_response=data)

                booking = payment.get_booking()
                is_party = isinstance(booking, _PartyBooking)

                if not already_processed:
                    # Only add to paid_amount on first successful verification
                    booking.paid_amount = (booking.paid_amount or Decimal("0")) + payment.amount

                # Always enforce correct status based on current paid_amount
                if (booking.paid_amount or Decimal("0")) >= booking.amount:
                    booking.payment_status = "PAID"
                    if is_party:
                        booking.status = "CONFIRMED"  # type: ignore[assignment]
                    else:
                        booking.booking_status = "CONFIRMED"
                else:
                    booking.payment_status = "PARTIAL"
                    if is_party:
                        booking.status = "DEPOSIT_PAID"  # type: ignore[assignment]

                if is_party:
                    booking.save(update_fields=["paid_amount", "payment_status", "status"])  # type: ignore[attr-defined]
                else:
                    booking.save(update_fields=["paid_amount", "payment_status", "booking_status"])  # type: ignore[attr-defined]

                logger.info(
                    f"Booking {booking.id} updated: payment_status={booking.payment_status}, "
                    f"paid_amount={booking.paid_amount}, already_processed={already_processed}"
                )
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

        payment.status = "REFUNDED"  # type: ignore[assignment]
        payment.notes  = f"Refunded £{refund_amount}"  # type: ignore[assignment]
        payment.save(update_fields=["status", "notes"])

        booking = payment.get_booking()
        booking.paid_amount = max(  # type: ignore[attr-defined]
            Decimal("0"), booking.paid_amount - Decimal(str(refund_amount))  # type: ignore[attr-defined]
        )
        if booking.paid_amount <= 0:  # type: ignore[attr-defined]
            booking.payment_status = "REFUNDED"  # type: ignore[attr-defined]
        else:
            booking.payment_status = "PARTIAL"  # type: ignore[attr-defined]
        booking.save(update_fields=["paid_amount", "payment_status"])  # type: ignore[attr-defined]

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
        """
        Look up which merchant API key to use for a checkout verification/refund
        by checking the stored Payment's provider_response._activity field.
        Falls back to SpinPin Ltd (skating) keys if not determinable.
        """
        try:
            payment = Payment.objects.get(order_id=checkout_id)  # type: ignore[attr-defined]
            stored  = payment.provider_response or {}
            activity = stored.get("_activity", "")
            creds   = _get_merchant_credentials(activity)
            return creds["api_key"]
        except Payment.DoesNotExist:  # type: ignore[attr-defined]
            pass

        # Default: SpinPin Ltd
        return (
            getattr(settings, "SUMUP_SKATING_API_KEY", "")
            or getattr(settings, "SUMUP_API_KEY", "")
        )
