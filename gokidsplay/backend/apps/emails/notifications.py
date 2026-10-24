"""
Every booking e-mail in one place: what the customer gets and what the Go Kids Play
team gets, for each thing that can happen to a booking.

  Customer                                  Team (STAFF_NOTIFICATION_EMAILS)
  ───────────────────────────────────────── ─────────────────────────────────────
  session paid      → confirmation          new session booking
  party deposit/full→ confirmation          new party booking
  party balance paid→ "balance paid"        party balance paid
  refund            → "refund on its way"   refund issued
  cancelled         → "booking cancelled"   booking cancelled
  unpaid (released) → "not completed"       —
  event reserved    → confirmation          new event reservation
  event request     → "request received"    new event request
  day before visit  → reminder              —

Each message is sent once: a key is stored in the e-mail log and checked first, so a
payment confirmed by both the success page and SumUp's webhook e-mails only once.
"""
import logging
from decimal import Decimal

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


# ── Recipients ───────────────────────────────────────────────────────────────

def staff_recipients():
    """The team's inbox(es): STAFF_NOTIFICATION_EMAILS, else Admin → Settings → contact e-mail."""
    configured = [e.strip() for e in str(getattr(settings, 'STAFF_NOTIFICATION_EMAILS', '') or '').split(',') if e.strip()]
    if configured:
        return configured
    from apps.core.models import GlobalSettings
    site = GlobalSettings.objects.first()
    return [getattr(site, 'contact_email', '') or 'info@gokidsplay.co.uk']


def _site_url():
    return str(getattr(settings, 'FRONTEND_URL', '') or '').rstrip('/')


def _already_sent(key):
    from .models import EmailLog
    return EmailLog.objects.filter(context_data__dedupe_key=key).exclude(status='FAILED').exists()


def _money(value):
    return f"£{Decimal(str(value or 0)):.2f}"


# ── What a booking looks like in an e-mail ───────────────────────────────────

def describe(obj):
    """Common details of a session / party / event booking for the e-mail templates."""
    from apps.bookings.models import Booking, EventBooking, PartyBooking
    from .services import activity_display_name

    if isinstance(obj, Booking):
        guests = (obj.kids or 0) + (obj.adults or 0) + (obj.spectators or 0)
        return {
            'kind': 'session', 'kind_label': 'Play session', 'reference': obj.booking_number or f'#{obj.id}',
            'name': obj.name, 'email': obj.email, 'phone': obj.phone,
            'title': activity_display_name(obj.activity), 'date': obj.date, 'time': obj.time,
            'guests': guests, 'total': obj.amount, 'paid': obj.paid_amount, 'balance': obj.remaining_balance,
            'admin_url': f"{_site_url()}/admin/session-bookings/{obj.id}", 'link': {'booking': obj},
        }
    if isinstance(obj, PartyBooking):
        return {
            'kind': 'party', 'kind_label': 'Birthday party', 'reference': obj.booking_number or f'#{obj.id}',
            'name': obj.name, 'email': obj.email, 'phone': obj.phone,
            'title': obj.package_name or 'Party', 'date': obj.date, 'time': obj.time,
            'guests': (obj.kids or 0) + (obj.adults or 0), 'total': obj.amount, 'paid': obj.paid_amount,
            'balance': obj.remaining_balance, 'child': obj.birthday_child_name,
            'admin_url': f"{_site_url()}/admin/party-bookings/{obj.id}", 'link': {'party_booking': obj},
        }
    if isinstance(obj, EventBooking):
        event = obj.event
        return {
            'kind': 'event', 'kind_label': 'Event reservation', 'reference': obj.booking_reference,
            'name': obj.name, 'email': obj.email, 'phone': obj.phone,
            'title': event.title, 'date': event.date, 'time': event.start_time,
            'guests': (obj.num_children or 0) + (obj.num_adults or 0), 'total': obj.subtotal,
            'paid': obj.amount_paid, 'balance': obj.balance_due,
            'admin_url': f"{_site_url()}/admin/events/{event.id}", 'link': {},
        }
    raise TypeError(f'Not a booking: {obj!r}')


def _rows(d, *, money=True):
    rows = [('Booking number', d['reference']), ('What', d['title'])]
    if d.get('child'):
        rows.append(('Birthday child', d['child']))
    when = d['date'].strftime('%A %d %B %Y') if d.get('date') else ''
    if d.get('time'):
        when += f" at {str(d['time'])[:5]}"
    rows += [('When', when), ('Guests', d['guests'])]
    if money:
        rows += [('Total', _money(d['total'])), ('Paid', _money(d['paid']))]
        if Decimal(str(d['balance'] or 0)) > 0:
            rows.append(('Still to pay', _money(d['balance'])))
    return rows


# ── Sending ──────────────────────────────────────────────────────────────────

def _send(*, to, name, email_type, subject, template, context, dedupe_key=None, reply_to=None, link=None):
    from .services import email_service
    if dedupe_key and _already_sent(dedupe_key):
        logger.info(f"E-mail already sent ({dedupe_key}), skipping")
        return None
    try:
        return email_service.send_email(
            email_type=email_type, recipient_email=to, recipient_name=name or '', subject=subject,
            template_name=template, context={**context, **({'dedupe_key': dedupe_key} if dedupe_key else {})},
            reply_to=reply_to, **(link or {}))
    except Exception as exc:  # an e-mail problem must never break a booking or payment
        logger.error(f"E-mail {email_type} to {to} failed: {exc}", exc_info=True)
        return None


def customer_update(obj, *, email_type, subject, heading, intro, key, note='', money=True,
                    button=('View my booking', '/account/bookings')):
    d = describe(obj)
    if not d['email']:
        return None
    return _send(
        to=d['email'], name=d['name'], email_type=email_type, subject=subject,
        template='emails/booking/status_update.html', dedupe_key=key, link=d['link'],
        context={'customer_name': (d['name'] or '').split(' ')[0] or 'there', 'heading': heading, 'intro': intro,
                 'note': note, 'rows': _rows(d, money=money),
                 'button_label': button[0] if button else '', 'button_url': f"{_site_url()}{button[1]}" if button else ''})


def staff_notice(obj, *, headline, key, extra_rows=(), money=True):
    """E-mail the team about a booking. Replies go straight to the customer."""
    d = describe(obj)
    rows = [('Customer', d['name']), ('E-mail', d['email']), ('Phone', d['phone'])] + _rows(d, money=money) + list(extra_rows)
    for to in staff_recipients():
        _send(to=to, name='Go Kids Play team', email_type='ADMIN_NOTIFICATION',
              subject=f"{headline} – {d['reference']} {d['name']}", template='emails/admin/notification.html',
              dedupe_key=f"{key}:{to}", reply_to=d['email'] or None, link=d['link'],
              context={'headline': headline, 'rows': rows, 'admin_url': d['admin_url'], 'kind_label': d['kind_label']})


# ── Events in a booking's life ───────────────────────────────────────────────

def payment_received(booking, payment):
    """A card payment for this booking went through (called once per payment, safe to repeat)."""
    from apps.bookings.models import PartyBooking
    from .services import email_service

    key = f"payment:{payment.order_id}"
    if _already_sent(f"{key}:customer"):
        return
    is_party = isinstance(booking, PartyBooking)
    first_payment = booking.payments.filter(status='SUCCESS').exclude(pk=payment.pk).count() == 0 \
        if hasattr(booking, 'payments') else True

    if not is_party:
        email_service.send_booking_confirmation(booking, extra_context={'dedupe_key': f"{key}:customer"})
        staff_notice(booking, headline='New session booking', key=key,
                     extra_rows=[('Paid online', _money(payment.amount))])
    elif first_payment:
        email_service.send_party_booking_confirmation(booking, extra_context={'dedupe_key': f"{key}:customer"})
        label = 'paid in full' if booking.payment_status == 'PAID' else 'deposit paid'
        staff_notice(booking, headline=f'New party booking ({label})', key=key,
                     extra_rows=[('Paid online', _money(payment.amount))])
    else:
        customer_update(booking, email_type='BALANCE_PAID', subject='Payment received – your party is all paid',
                        heading='Thank you – payment received',
                        intro=f"We've received your payment of {_money(payment.amount)}. "
                              + ("Your party is now fully paid." if booking.payment_status == 'PAID' else ''),
                        key=f"{key}:customer")
        staff_notice(booking, headline='Party balance paid online', key=key,
                     extra_rows=[('Paid online', _money(payment.amount))])


def refund_issued(booking, amount, reason=''):
    key = f"refund:{type(booking).__name__}:{booking.id}:{timezone.now():%Y%m%d%H%M%S}"
    customer_update(booking, email_type='PAYMENT_REFUNDED', subject='Your refund from Go Kids Play',
                    heading='Your refund is on its way',
                    intro=f"We've refunded {_money(amount)} to the card you paid with. "
                          "It usually shows in your account within 3–5 working days.",
                    note=reason, key=f"{key}:customer")
    staff_notice(booking, headline='Refund issued', key=key, extra_rows=[('Refunded', _money(amount))])


def booking_cancelled(booking, *, unpaid_release=False):
    kind = type(booking).__name__
    key = f"cancel:{kind}:{booking.id}"
    if unpaid_release:
        customer_update(booking, email_type='BOOKING_CANCELLED', subject='Your booking was not completed',
                        heading="Your booking wasn't completed",
                        intro="We didn't receive the payment for this booking, so the places have been released. "
                              "No money has been taken. You're welcome to book again any time.",
                        key=f"{key}:customer", money=False, button=('Book again', '/book'))
        return
    is_party = kind == 'PartyBooking'
    customer_update(booking, email_type='PARTY_CANCELLED' if is_party else 'BOOKING_CANCELLED',
                    subject='Your Go Kids Play booking has been cancelled', heading='Booking cancelled',
                    intro="Your booking has been cancelled. If you've paid, we'll be in touch about any refund "
                          "in line with our booking terms. Questions? Just reply to this e-mail.",
                    key=f"{key}:customer", button=('Book again', '/party-booking' if is_party else '/book'))
    staff_notice(booking, headline='Booking cancelled', key=key)


def event_reserved(event_booking):
    staff_notice(event_booking, headline='New event reservation', key=f"event-booking:{event_booking.id}",
                 extra_rows=[('Payment', 'Paid at the venue')])


def event_request_received(req):
    """Customer asked for a private / special event."""
    when = req.preferred_date.strftime('%A %d %B %Y')
    rows = [('Reference', req.reference), ('Type', req.get_event_type_display()), ('Preferred date', when),
            ('Alternative date', req.alternative_date.strftime('%A %d %B %Y') if req.alternative_date else '—'),
            ('Time', req.preferred_time or '—'), ('Children / adults', f"{req.num_children} / {req.num_adults}"),
            ('Budget', req.budget or '—'), ('Details', req.details)]
    _send(to=req.email, name=req.name, email_type='EVENT_REQUEST_RECEIVED',
          subject=f"We've received your event request ({req.reference})",
          template='emails/booking/status_update.html', dedupe_key=f"event-request:{req.id}:customer",
          context={'customer_name': req.name.split(' ')[0], 'heading': 'Thanks – we have your request',
                   'intro': "Our team will look at the date and details and get back to you, usually within "
                            "1–2 working days. You can reply to this e-mail to add anything.",
                   'rows': rows, 'note': '', 'button_label': 'See our events', 'button_url': f"{_site_url()}/events"})
    for to in staff_recipients():
        _send(to=to, name='Go Kids Play team', email_type='ADMIN_NOTIFICATION',
              subject=f"New event request – {req.reference} {req.name}", template='emails/admin/notification.html',
              dedupe_key=f"event-request:{req.id}:{to}", reply_to=req.email,
              context={'headline': 'New event request', 'kind_label': 'Event request',
                       'rows': [('Customer', req.name), ('E-mail', req.email), ('Phone', req.phone)] + rows,
                       'admin_url': f"{_site_url()}/admin/events"})


def reminder(obj):
    """The day before the visit."""
    d = describe(obj)
    return customer_update(obj, email_type='PARTY_REMINDER' if d['kind'] == 'party' else 'BOOKING_REMINDER',
                    subject=f"See you tomorrow at Go Kids Play! ({d['reference']})",
                    heading='See you tomorrow!',
                    intro="Just a reminder of your booking tomorrow. Please arrive 10–15 minutes early, and remember "
                          "grip socks are needed in the play areas.",
                    note=(f"Balance to pay on the day: {_money(d['balance'])}"
                          if Decimal(str(d['balance'] or 0)) > 0 and d['kind'] != 'session' else ''),
                    key=f"reminder:{d['kind']}:{obj.id}")
