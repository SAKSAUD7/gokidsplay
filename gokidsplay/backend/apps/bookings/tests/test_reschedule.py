"""Customers moving their own booking in My Account (apps/bookings/reschedule.py)."""
from datetime import datetime, timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.bookings.models import Booking, BookingAuditLog, PartyBooking
from apps.bookings.tests.test_booking_security import (  # noqa: F401  (fixtures)
    PARTIES_URL, PARTY_PAYLOAD, SESSIONS_URL, config, next_saturday, plans, session_payload, staff_client,
)
from apps.bookings.tests.test_emails import TEAM, outbox, to  # noqa: F401  (fixture)

EMAIL = 'mover@example.com'


def signed_in():
    client = APIClient()
    token = client.post('/api/v1/bookings/customer-auth/register/',
                        {'name': 'Mo Ver', 'email': EMAIL, 'password': 'secret-pass'}, format='json').data['token']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return client


def paid_session(plans, **overrides):
    booking_id = APIClient().post(SESSIONS_URL, session_payload(plans, **{'email': EMAIL, **overrides}),
                                  format='json').data['id']
    booking = Booking.objects.get(pk=booking_id)
    Booking.objects.filter(pk=booking_id).update(payment_status='PAID', paid_amount=booking.amount,
                                                 booking_status='CONFIRMED')
    return Booking.objects.get(pk=booking_id)


def url(booking, kind='session'):
    return f'/api/v1/bookings/customer-auth/booking/{kind}/{booking.id}/reschedule/'


@pytest.mark.django_db
class TestCustomerChangesDate:
    def test_moves_a_paid_session_and_everyone_knows(self, config, plans, outbox, django_capture_on_commit_callbacks):
        client = signed_in()
        booking = paid_session(plans)
        price = booking.amount
        options = client.get(url(booking)).data
        assert options['allowed'] and options['changes_left'] == 2 and options['fee'] == 0
        new_day = next_saturday() + timedelta(days=7)
        assert new_day.isoformat() in options['dates']
        times = client.get(url(booking), {'date': new_day.isoformat()}).data['times']
        # Anytime sessions (the site's setting): one start time a day, the opening time
        assert [(t['time'], t['available']) for t in times] == [('10:30', True)]

        with django_capture_on_commit_callbacks(execute=True):
            response = client.post(url(booking), {'date': new_day.isoformat(), 'time': '10:30'}, format='json')
        assert response.status_code == 200, response.data
        assert (response.data['date'], response.data['time']) == (new_day.isoformat(), '10:30')
        booking.refresh_from_db()
        assert booking.original_date == next_saturday() and booking.reschedule_count == 1
        assert booking.amount == price and booking.payment_status == 'PAID'   # same price, still paid
        # Admin portal: the booking's history and a notification
        changes = {log.field_changed: (log.old_value, log.new_value, log.changed_by)
                   for log in BookingAuditLog.objects.filter(booking_id=booking.id, booking_type='SESSION')}
        assert changes['date'] == (next_saturday().isoformat(), new_day.isoformat(), f'Customer ({EMAIL})')
        assert 'time' not in changes                       # same start time, new day
        from apps.core.models import Notification
        assert Notification.objects.filter(title='Booking moved by customer').count() == 1
        assert 'new date' in to(outbox, EMAIL)[0]['subject']
        assert 'moved by the customer' in to(outbox, TEAM)[0]['subject']

    def test_closes_ten_hours_before(self, config, plans):
        client = signed_in()
        booking = paid_session(plans)
        start = timezone.make_aware(datetime.combine(booking.date, booking.time))
        Booking.objects.filter(pk=booking.pk).update(date=(start - timedelta(hours=9)).date())
        from apps.bookings import reschedule
        assert not reschedule.eligibility(booking, now=start - timedelta(hours=9, minutes=59)).allowed
        assert reschedule.eligibility(booking, now=start - timedelta(hours=10, minutes=1)).allowed
        assert 'Date changes close 10 hours' in reschedule.eligibility(booking, now=start - timedelta(hours=5)).reason

    def test_full_or_invented_times_are_refused(self, config, plans, monkeypatch):
        client = signed_in()
        booking = paid_session(plans)
        new_day = (next_saturday() + timedelta(days=7)).isoformat()
        bad = client.post(url(booking), {'date': new_day, 'time': '10:47'}, format='json')
        assert bad.status_code == 400 and bad.data['code'] == 'INVALID_TIME'
        monkeypatch.setattr('apps.bookings.availability_service.session_capacity', lambda: 3)   # 6 guests won't fit
        full = client.post(url(booking), {'date': new_day, 'time': '10:30'}, format='json')
        assert full.status_code == 409
        closed = client.post(url(booking), {'date': (next_saturday() + timedelta(days=2)).isoformat(),  # Monday
                                            'time': '10:30'}, format='json')
        assert closed.status_code in (400, 409)
        assert Booking.objects.get(pk=booking.pk).date == next_saturday()

    def test_unpaid_online_bookings_and_other_peoples_bookings_cannot_move(self, config, plans):
        client = signed_in()
        unpaid = Booking.objects.get(pk=APIClient().post(SESSIONS_URL, session_payload(plans, email=EMAIL),
                                                         format='json').data['id'])
        assert 'complete the payment' in client.get(url(unpaid)).data['reason']
        stranger = paid_session(plans, email='someone-else@example.com')
        Booking.objects.filter(pk=stranger.pk).update(email='someone-else@example.com')
        assert client.get(url(stranger)).status_code == 404
        assert APIClient().get(url(stranger)).status_code == 401

    def test_limited_number_of_moves(self, config, plans):
        client = signed_in()
        booking = paid_session(plans)
        for weeks in (1, 2):
            day = (next_saturday() + timedelta(days=7 * weeks)).isoformat()
            assert client.post(url(booking), {'date': day, 'time': '10:30'}, format='json').status_code == 200
        third = client.post(url(booking), {'date': (next_saturday() + timedelta(days=21)).isoformat(), 'time': '10:30'},
                            format='json')
        assert third.status_code == 400 and 'maximum number' in third.data['error']
        assert Booking.objects.get(pk=booking.pk).original_date == next_saturday()

    def test_party_within_14_days_adds_the_change_fee(self, config, outbox, django_capture_on_commit_callbacks):
        from apps.cms.models import PartyBookingConfig
        PartyBookingConfig.objects.create(available_time_slots=['12:00 PM', '2:00 PM'])
        client = signed_in()
        party_id = APIClient().post(PARTIES_URL, {**PARTY_PAYLOAD, 'email': EMAIL, 'date': next_saturday().isoformat()},
                                    format='json').data['id']
        PartyBooking.objects.filter(pk=party_id).update(paid_amount=models_amount(party_id), payment_status='PAID',
                                                        status='CONFIRMED')
        party = PartyBooking.objects.get(pk=party_id)
        before = party.amount
        assert client.get(url(party, 'party')).data['fee'] == 50.0
        with django_capture_on_commit_callbacks(execute=True):
            moved = client.post(url(party, 'party'), {'date': (next_saturday() + timedelta(days=7)).isoformat(),
                                                      'time': '14:00'}, format='json')
        assert moved.status_code == 200, moved.data
        party.refresh_from_db()
        assert party.amount == before + Decimal('50.00') and party.remaining_balance == Decimal('50.00')
        assert party.payment_status == 'PARTIAL' and party.status == 'CONFIRMED'
        assert '£50.00 change fee' in to(outbox, EMAIL)[0]['html']

    def test_cannot_cancel_a_visit_that_has_happened(self, config, plans):
        client = signed_in()
        booking = paid_session(plans)
        Booking.objects.filter(pk=booking.pk).update(date=timezone.localdate() - timedelta(days=1))
        response = client.patch(f'/api/v1/bookings/customer-auth/booking/session/{booking.id}/', {'action': 'cancel'},
                                format='json')
        assert response.status_code == 400
        assert Booking.objects.get(pk=booking.pk).booking_status == 'CONFIRMED'

    def test_my_bookings_shows_times_and_whether_the_date_can_change(self, config, plans):
        client = signed_in()
        paid_session(plans)
        item = client.get('/api/v1/bookings/customer-auth/my-bookings/').data['bookings'][0]
        assert item['time'] == '10:30' and item['reschedule']['allowed'] is True


def models_amount(party_id):
    return PartyBooking.objects.get(pk=party_id).amount


@pytest.mark.django_db
def test_staff_reschedule_marks_a_paid_party_as_owing_the_fee(config, staff_client):
    party_id = APIClient().post(PARTIES_URL, {**PARTY_PAYLOAD, 'date': next_saturday().isoformat()}, format='json').data['id']
    PartyBooking.objects.filter(pk=party_id).update(paid_amount=models_amount(party_id), payment_status='PAID')
    response = staff_client.post(f'/api/v1/bookings/party-bookings/{party_id}/reschedule/',
                                 {'new_date': (next_saturday() + timedelta(days=7)).isoformat(), 'new_time': '15:00'},
                                 format='json')
    assert response.status_code == 200 and response.data['admin_fee_charged'] == 50.0
    party = PartyBooking.objects.get(pk=party_id)
    assert (party.status, party.payment_status, party.remaining_balance) == ('RESCHEDULED', 'PARTIAL', Decimal('50.00'))
    assert BookingAuditLog.objects.filter(booking_id=party_id, booking_type='PARTY', field_changed='date').exists()
