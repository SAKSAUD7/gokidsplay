"""
SpinPin Email Service Layer
===========================
Production-grade email service for booking confirmations, party notifications,
and admin alerts. Supports SMTP, SendGrid, and Mailgun providers.

CONFIGURATION (in backend/.env):
─────────────────────────────────
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@spinpin.co.uk
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=SpinPin Leicester <noreply@spinpin.co.uk>
ADMIN_EMAIL=admin@spinpin.co.uk

For Gmail: Create an App Password at https://myaccount.google.com/apppasswords
For SendGrid: Use smtp.sendgrid.net with port 587, user = apikey, password = SG.xxx
"""

import logging
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone

logger = logging.getLogger(__name__)


class EmailService:
    """
    Centralised email service for SpinPin.
    All email sending is routed through this class so configuration
    is in one place and easily swapped for production.
    """

    FROM_EMAIL = getattr(settings, "DEFAULT_FROM_EMAIL", "SpinPin Leicester <noreply@spinpin.co.uk>")
    ADMIN_EMAIL = getattr(settings, "ADMIN_EMAIL", "info@spinpin.co.uk")

    # ──────────────────────────────────────────────────────────────────────────
    # PARTY BOOKING EMAILS
    # ──────────────────────────────────────────────────────────────────────────

    @classmethod
    def send_party_booking_confirmation(cls, booking) -> bool:
        """
        Send confirmation email to customer after party booking is created.
        Returns True on success, False on failure.
        """
        try:
            subject = f"🎉 Party Booking Confirmed – {booking.booking_number or f'SP-{booking.id}'}"

            total = float(booking.amount)
            deposit = total * 0.5
            balance = max(0, total - float(booking.paid_amount))

            text_body = f"""
Hi {booking.name},

Your party booking at Spin Pin Leicester has been received!

BOOKING DETAILS
─────────────────────────────────
Booking Ref: {booking.booking_number or f"SPPARTY-{booking.id}"}
Party Date:  {booking.date}
Time:        {booking.time}
Package:     {booking.package_name}
Guests:      {booking.kids}
─────────────────────────────────

PAYMENT SUMMARY
Total:        £{total:.2f}
50% Deposit:  £{deposit:.2f} (required to confirm)
Balance Due:  £{balance:.2f} (on the day)

NEXT STEPS
1. Pay your 50% deposit via bank transfer or card to confirm your booking.
2. We'll send you our bank details in a follow-up email.
3. All guests must sign our waiver before participating.

If you have any questions, please contact us:
  📞 07349 110865
  📧 info@spinpin.co.uk
  📍 Merlin Works, 8 Exploration Dr, Leicester LE4 5FX

We can't wait to make it a memorable day!

The Spin Pin Team
spinpin.co.uk
"""

            html_body = f"""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body {{ font-family: Arial, sans-serif; background: #111; color: #fff; margin: 0; padding: 0; }}
  .wrapper {{ max-width: 600px; margin: 0 auto; background: #1a1a1a; }}
  .header {{ background: #FFD700; padding: 24px; text-align: center; }}
  .header h1 {{ margin: 0; color: #000; font-size: 24px; }}
  .header p {{ margin: 4px 0 0; color: #333; font-size: 13px; }}
  .body {{ padding: 28px 24px; }}
  .section {{ background: #222; border-radius: 12px; padding: 20px; margin: 16px 0; border-left: 4px solid #FFD700; }}
  .section h2 {{ color: #FFD700; margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }}
  .row {{ display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #333; font-size: 14px; }}
  .row:last-child {{ border: none; }}
  .row .label {{ color: #aaa; }}
  .row .value {{ color: #fff; font-weight: bold; }}
  .deposit {{ background: #2a1a00; border: 1px solid #FFD700; border-radius: 8px; padding: 14px; margin-top: 12px; }}
  .deposit p {{ margin: 4px 0; font-size: 13px; color: #FFD700; }}
  .footer {{ background: #000; padding: 20px; text-align: center; font-size: 12px; color: #666; }}
  .footer a {{ color: #FFD700; text-decoration: none; }}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>🎉 SPIN PIN LEICESTER</h1>
    <p>Merlin Works, 8 Exploration Dr, Leicester LE4 5FX</p>
  </div>
  <div class="body">
    <h2 style="color:#FFD700">Party Booking Confirmed!</h2>
    <p style="color:#ccc">Hi <strong style="color:#fff">{booking.name}</strong>, your party booking has been received. Here are your details:</p>

    <div class="section">
      <h2>Booking Details</h2>
      <div class="row"><span class="label">Booking Ref:</span><span class="value">{booking.booking_number or f"SPPARTY-{booking.id}"}</span></div>
      <div class="row"><span class="label">Party Date:</span><span class="value">{booking.date}</span></div>
      <div class="row"><span class="label">Time:</span><span class="value">{booking.time}</span></div>
      <div class="row"><span class="label">Package:</span><span class="value">{booking.package_name}</span></div>
      <div class="row"><span class="label">Guests:</span><span class="value">{booking.kids}</span></div>
      {"<div class='row'><span class='label'>Birthday Child:</span><span class='value'>" + booking.birthday_child_name + " (Age " + str(booking.birthday_child_age) + ")</span></div>" if booking.birthday_child_name else ""}
    </div>

    <div class="section">
      <h2>Payment Summary</h2>
      <div class="row"><span class="label">Total Amount:</span><span class="value">£{total:.2f}</span></div>
      <div class="row"><span class="label">50% Deposit:</span><span class="value">£{deposit:.2f}</span></div>
      <div class="row"><span class="label">Balance Due on Day:</span><span class="value">£{balance:.2f}</span></div>
    </div>

    <div class="deposit">
      <p><strong>⚡ Next Step:</strong> Pay your 50% deposit (£{deposit:.2f}) to confirm your booking.</p>
      <p>We'll send payment details separately. Call us on <a href="tel:07349110865">07349 110865</a> with any questions.</p>
    </div>
  </div>
  <div class="footer">
    <p><a href="mailto:info@spinpin.co.uk">info@spinpin.co.uk</a> | 07349 110865 | <a href="https://spinpin.co.uk">spinpin.co.uk</a></p>
    <p>© {timezone.now().year} Spin Pin Leicester. All rights reserved.</p>
  </div>
</div>
</body>
</html>
"""

            msg = EmailMultiAlternatives(subject, text_body, cls.FROM_EMAIL, [booking.email])
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)

            logger.info(f"[EmailService] Party confirmation sent to {booking.email} — Booking {booking.booking_number}")
            return True

        except Exception as e:
            logger.error(f"[EmailService] Failed to send party confirmation to {booking.email}: {e}")
            return False

    @classmethod
    def send_party_booking_admin_alert(cls, booking) -> bool:
        """
        Notify admin staff when a new party booking is created.
        """
        try:
            subject = f"[NEW PARTY BOOKING] {booking.name} — {booking.date} at {booking.time}"

            text_body = f"""
New party booking received!

Customer: {booking.name}
Email:    {booking.email}
Phone:    {booking.phone}
Date:     {booking.date}
Time:     {booking.time}
Package:  {booking.package_name}
Guests:   {booking.kids}
Amount:   £{float(booking.amount):.2f}
Deposit:  £{float(booking.amount) * 0.5:.2f}
Ref:      {booking.booking_number or f"SPPARTY-{booking.id}"}

Special Requests: {booking.special_requests or "None"}
Dietary:          {booking.dietary_restrictions or "None"}

View in admin: http://localhost:9000/admin/bookings/partybooking/{booking.id}/change/
"""
            send_mail(subject, text_body, cls.FROM_EMAIL, [cls.ADMIN_EMAIL], fail_silently=True)
            logger.info(f"[EmailService] Admin alert sent for booking {booking.booking_number}")
            return True

        except Exception as e:
            logger.error(f"[EmailService] Failed to send admin alert: {e}")
            return False

    # ──────────────────────────────────────────────────────────────────────────
    # SESSION BOOKING EMAILS
    # ──────────────────────────────────────────────────────────────────────────

    @classmethod
    def send_session_booking_confirmation(cls, booking) -> bool:
        """
        Send confirmation email after a regular session booking.
        """
        try:
            subject = f"✅ Booking Confirmed – {booking.booking_number or f'SP-{booking.id}'}"
            text_body = f"""
Hi {booking.name},

Your session at Spin Pin Leicester has been confirmed!

Date:     {booking.date}
Time:     {booking.time}
Adults:   {booking.adults}
Kids:     {booking.kids}
Amount:   £{float(booking.amount):.2f}
Ref:      {booking.booking_number or f"SP-{booking.id}"}

See you soon!
The Spin Pin Team
"""
            send_mail(subject, text_body, cls.FROM_EMAIL, [booking.email], fail_silently=False)
            logger.info(f"[EmailService] Session confirmation sent to {booking.email}")
            return True
        except Exception as e:
            logger.error(f"[EmailService] Failed to send session confirmation: {e}")
            return False


# ──────────────────────────────────────────────────────────────────────────────
# CONVENIENCE FUNCTIONS (for use in views)
# ──────────────────────────────────────────────────────────────────────────────

def send_party_confirmation(booking) -> bool:
    """Shortcut: sends both customer confirmation and admin alert."""
    customer_ok = EmailService.send_party_booking_confirmation(booking)
    EmailService.send_party_booking_admin_alert(booking)  # Always try admin alert
    return customer_ok


def send_session_confirmation(booking) -> bool:
    return EmailService.send_session_booking_confirmation(booking)
