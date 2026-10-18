"""
Global Search Service for the admin portal (header search box, Ctrl+K).

One query searches everything staff look things up by:
  - booking numbers (GK…, GP…, EV…, ER…) typed any way, names, emails, phone
    numbers (with or without spaces) and dates ("24/10", "24/10/2026", "2026-10-24")
  - session, party and event bookings, event requests, customers, payments,
    vouchers, contact messages, campaigns and admin users
  - admin screens by keyword ("opening hours", "refund", "prices"…)

Each result has a route to open it; `view_all` routes open the matching list
already filtered. Results are limited by the user's role (RBAC).
"""
import re
from datetime import date

from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

PER_TYPE = 5

# Admin screens, found by keyword
ADMIN_SCREENS = [
    ('Opening Days', '/admin/calendar/opening', 'open close date closure special opening holiday private hire calendar'),
    ('Opening hours & session rules', '/admin/cms/session-booking', 'opening hours times session rules booking fee notice duration capacity'),
    ('Ticket prices', '/admin/cms/pricing-plans', 'prices pricing tickets cost admission'),
    ('Party prices & times', '/admin/cms/party-booking', 'party prices package deposit party times minimum children'),
    ('Bookings calendar', '/admin/calendar', 'calendar bookings day schedule capacity'),
    ('Session bookings', '/admin/bookings', 'session bookings tickets visits'),
    ('Party bookings', '/admin/party-bookings', 'party parties birthday bookings'),
    ('All bookings', '/admin/all-bookings', 'all bookings'),
    ('New walk-in booking', '/admin/session-bookings/new', 'walk in manual desk booking new'),
    ('New party booking', '/admin/party-bookings/new', 'new party booking manual'),
    ('Special events', '/admin/events', 'events special halloween christmas'),
    ('Event reservations & requests', '/admin/events/reservations', 'event reservations requests'),
    ('Payments', '/admin/payments', 'payments refunds sumup money revenue transactions'),
    ('Customers', '/admin/customers', 'customers accounts families'),
    ('Vouchers', '/admin/vouchers', 'vouchers discount promo codes'),
    ('Website Content', '/admin/cms', 'website content cms pages text images'),
    ('Customer reviews & Google', '/admin/cms/collections/testimonials', 'reviews testimonials google rating'),
    ('Gallery photos', '/admin/cms/gallery', 'gallery photos images pictures'),
    ('Opening hours bar', '/admin/cms/timing-cards', 'hours bar timing cards'),
    ('Contact messages', '/admin/cms/contact-messages', 'messages enquiries contact inbox'),
    ('Party invitations', '/admin/invitations', 'invitations templates e-invites'),
    ('Settings', '/admin/settings', 'settings phone email address maintenance pause online booking'),
    ('Admin users', '/admin/users', 'users staff accounts roles permissions'),
    ('Activity log', '/admin/activity-logs', 'activity logs audit history changes'),
    ('Email campaigns', '/admin/marketing', 'marketing campaigns emails newsletter'),
]


def _parse_date(text: str):
    """'24/10', '24/10/2026', '24-10-26' or '2026-10-24' → date (UK day/month order)."""
    text = text.strip()
    m = re.fullmatch(r'(\d{4})-(\d{1,2})-(\d{1,2})', text)
    try:
        if m:
            return date(int(m[1]), int(m[2]), int(m[3]))
        m = re.fullmatch(r'(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?', text)
        if m:
            year = int(m[3]) if m[3] else date.today().year
            if year < 100:
                year += 2000
            return date(year, int(m[2]), int(m[1]))
    except ValueError:
        return None
    return None


class GlobalSearchService:
    def __init__(self, user, query):
        from apps.bookings.references import normalise_reference
        self.user = user
        self.query = query.strip()
        self.ref = normalise_reference(self.query)
        digits = re.sub(r'\D', '', self.query)
        self.phone = digits[-6:] if len(digits) >= 6 else ''
        self.day = _parse_date(self.query)
        self.allowed_modules = self._get_allowed_modules()
        self.results = []

    def _get_allowed_modules(self):
        role = str(getattr(self.user, 'role', 'STAFF') or 'STAFF').upper()
        everything = ['screens', 'bookings', 'customers', 'events', 'payments', 'vouchers', 'messages', 'campaigns', 'users']
        modules = {
            'ADMIN': everything,
            'MANAGER': [m for m in everything if m != 'users'],
            'CONTENT_MANAGER': ['screens', 'events', 'messages', 'campaigns'],
            'STAFF': ['screens', 'bookings', 'customers', 'events', 'payments', 'messages'],
            'EMPLOYEE': ['screens', 'bookings', 'customers', 'events', 'messages'],
        }
        if self.user.is_superuser:
            return everything
        return modules.get(role, modules['STAFF'])

    def search_all(self):
        if len(self.query) < 2:
            return []
        for module in self.allowed_modules:
            getattr(self, f'_search_{module}')()
        return self.results

    def _add(self, type_, title, subtitle, route, view_all=None):
        self.results.append({'type': type_, 'title': title, 'subtitle': subtitle, 'route': route,
                             **({'view_all': view_all} if view_all else {})})

    def _person_q(self, *, phone=True, prefix=''):
        q = Q(**{f'{prefix}name__icontains': self.query}) | Q(**{f'{prefix}email__icontains': self.query})
        if phone:
            q |= Q(**{f'{prefix}phone__icontains': self.query})
            if self.phone:
                q |= Q(**{f'{prefix}phone__icontains': self.phone})
        return q

    # ── Admin screens ──────────────────────────────────────────────────────
    def _search_screens(self):
        words = self.query.lower().split()
        matched = [(name, route) for name, route, keywords in ADMIN_SCREENS
                   if all(w in f'{name.lower()} {keywords}' for w in words)]
        for name, route in matched[:PER_TYPE]:
            self._add('screen', name, 'Admin screen', route)

    # ── Bookings ───────────────────────────────────────────────────────────
    def _search_bookings(self):
        from apps.bookings.models import Booking, PartyBooking

        session_q = self._person_q() | Q(booking_number__icontains=self.ref)
        party_q = self._person_q() | Q(booking_number__icontains=self.ref) | Q(birthday_child_name__icontains=self.query)
        if self.day:
            session_q |= Q(date=self.day)
            party_q |= Q(date=self.day)
        if self.query.isdigit():
            session_q |= Q(id=int(self.query))
            party_q |= Q(id=int(self.query))

        sessions = Booking.objects.filter(session_q).order_by('-date', '-created_at')
        total = sessions.count()
        for b in sessions[:PER_TYPE]:
            self._add('booking', f"{b.booking_number or f'#{b.id}'} · {b.name}",
                      f"{b.date:%a %d %b %Y} · {(b.adults or 0) + (b.kids or 0)} guests · "
                      f"{(b.booking_status or '').title()} · {(b.payment_status or '').title()}",
                      f'/admin/bookings/{b.id}',
                      f'/admin/bookings?search={self.query}' if total > PER_TYPE else None)

        parties = PartyBooking.objects.filter(party_q).order_by('-date', '-created_at')
        total = parties.count()
        for b in parties[:PER_TYPE]:
            child = f" · {b.birthday_child_name}" if b.birthday_child_name else ''
            self._add('party_booking', f"{b.booking_number or f'#{b.id}'} · {b.name}{child}",
                      f"{b.date:%a %d %b %Y} {str(b.time)[:5]} · {b.kids} children · "
                      f"{(b.status or '').replace('_', ' ').title()} · {(b.payment_status or '').title()}",
                      f'/admin/party-bookings/{b.id}',
                      f'/admin/party-bookings?search={self.query}' if total > PER_TYPE else None)

    # ── Customers ──────────────────────────────────────────────────────────
    def _search_customers(self):
        from apps.bookings.models import Customer
        customers = Customer.objects.filter(self._person_q()).order_by('-created_at')
        total = customers.count()
        for c in customers[:PER_TYPE]:
            self._add('customer', c.name or c.email, ' · '.join(filter(None, [c.email, c.phone])),
                      f'/admin/customers/{c.id}',
                      f'/admin/customers?search={self.query}' if total > PER_TYPE else None)

    # ── Special events: reservations, requests and the events themselves ──
    def _search_events(self):
        from apps.bookings.models import EventBooking, EventRequest, SpecialEvent

        reservation_q = self._person_q() | Q(booking_reference__icontains=self.ref) | Q(event__title__icontains=self.query)
        for b in EventBooking.objects.filter(reservation_q).select_related('event').order_by('-created_at')[:PER_TYPE]:
            self._add('event_booking', f"{b.booking_reference} · {b.name}",
                      f"{b.event.title} · {b.event.date:%d %b %Y} · {b.num_children + b.num_adults} people",
                      f'/admin/events/reservations?search={b.booking_reference}')

        request_q = self._person_q() | Q(reference__icontains=self.ref)
        if self.day:
            request_q |= Q(preferred_date=self.day)
        for r in EventRequest.objects.filter(request_q).order_by('-created_at')[:PER_TYPE]:
            self._add('event_request', f"{r.reference} · {r.name}",
                      f"{r.get_event_type_display()} · wants {r.preferred_date:%d %b %Y} · {r.get_status_display()}",
                      f'/admin/events/reservations?tab=requests&search={r.reference}')

        event_q = Q(title__icontains=self.query)
        if self.day:
            event_q |= Q(date=self.day)
        for e in SpecialEvent.objects.filter(event_q).order_by('-date')[:PER_TYPE]:
            self._add('event', e.title, f"{e.date:%a %d %b %Y} · {e.get_status_display()}", f'/admin/events/{e.id}')

    # ── Payments ───────────────────────────────────────────────────────────
    def _search_payments(self):
        from apps.payments.models import Payment

        payments = Payment.objects.filter(
            Q(order_id__icontains=self.query) | Q(payment_id__icontains=self.query)
            | Q(booking__booking_number__icontains=self.ref) | Q(party_booking__booking_number__icontains=self.ref)
            | self._person_q(phone=False, prefix='booking__') | self._person_q(phone=False, prefix='party_booking__')
        ).select_related('booking', 'party_booking').order_by('-created_at')
        total = payments.count()
        for payment in payments[:PER_TYPE]:
            booking = payment.booking or payment.party_booking
            number = (booking.booking_number or f'#{booking.id}') if booking else ''
            who = booking.name if booking else 'No booking'
            self._add('payment', f"£{payment.amount:,.2f} · {number or payment.order_id}",
                      f"{who} · {payment.get_provider_display()} · {payment.status.title()} · {payment.created_at:%d %b %Y}",
                      f'/admin/payments/{payment.id}',
                      f'/admin/payments?search={self.query}' if total > PER_TYPE else None)

    # ── Vouchers ───────────────────────────────────────────────────────────
    def _search_vouchers(self):
        from apps.shop.models import Voucher
        for voucher in Voucher.objects.filter(Q(code__icontains=self.query) | Q(description__icontains=self.query))[:PER_TYPE]:
            discount = (f"{voucher.discount_value:g}%" if voucher.discount_type == 'PERCENTAGE'
                        else f"£{voucher.discount_value:,.2f}")
            self._add('voucher', voucher.code,
                      f"{discount} off · {'Active' if voucher.is_active else 'Inactive'} · used {voucher.used_count}×",
                      f'/admin/vouchers/{voucher.id}')

    # ── Contact messages ───────────────────────────────────────────────────
    def _search_messages(self):
        from apps.cms.models import ContactMessage
        messages = ContactMessage.objects.filter(
            self._person_q() | Q(message__icontains=self.query) | Q(ticket_id__icontains=self.query)
        ).order_by('-created_at')
        for message in messages[:PER_TYPE]:
            preview = message.message[:60] + ('…' if len(message.message) > 60 else '')
            self._add('message', message.name,
                      f"{preview} · {self._get_time_ago(message.created_at)}" + ('' if message.is_read else ' · Unread'),
                      f'/admin/cms/contact-messages/{message.id}')

    # ── Campaigns ──────────────────────────────────────────────────────────
    def _search_campaigns(self):
        from apps.marketing.models import MarketingCampaign
        for campaign in MarketingCampaign.objects.filter(
                Q(title__icontains=self.query) | Q(subject__icontains=self.query))[:PER_TYPE]:
            self._add('campaign', campaign.title, f"Email · {campaign.get_status_display()}",
                      f'/admin/marketing?search={campaign.title}')

    # ── Admin users ────────────────────────────────────────────────────────
    def _search_users(self):
        users = User.objects.filter(
            Q(username__icontains=self.query) | Q(email__icontains=self.query)
            | Q(first_name__icontains=self.query) | Q(last_name__icontains=self.query) | Q(name__icontains=self.query)
        )[:PER_TYPE]
        for user in users:
            name = getattr(user, 'name', '') or f"{user.first_name} {user.last_name}".strip() or user.username
            self._add('user', name, f"{user.email} · {getattr(user, 'role', 'User')}", f'/admin/users/{user.id}')

    def _get_time_ago(self, dt):
        from datetime import timedelta
        from django.utils import timezone
        diff = timezone.now() - dt
        if diff < timedelta(minutes=1):
            return 'Just now'
        if diff < timedelta(hours=1):
            mins = int(diff.total_seconds() / 60)
            return f'{mins} min{"s" if mins != 1 else ""} ago'
        if diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f'{hours} hour{"s" if hours != 1 else ""} ago'
        if diff < timedelta(days=7):
            return f'{diff.days} day{"s" if diff.days != 1 else ""} ago'
        return dt.strftime('%d %b %Y')
