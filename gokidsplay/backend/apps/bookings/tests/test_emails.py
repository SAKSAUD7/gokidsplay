"""
Who gets which e-mail. Sending is replaced by a recorder; everything else (templates,
e-mail log, de-duplication) runs for real.
"""
from datetime import time, timedelta
from decimal import Decimal

import pytest
from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APIClient

from apps.bookings.models import Booking, PartyBooking
from apps.bookings.tests.test_booking_security import (  # noqa: F401  (fixtures)
    PARTIES_URL, PARTY_PAYLOAD, SESSIONS_URL, config, mock_payments, next_saturday, plans, session_payload, staff_client,
)

TEAM = 'team@gokidsplay.co.uk'


@pytest.fixture
def outbox(settings, monkeypatch):
    from apps.emails.services import EmailService
    settings.EMAIL_ENABLED = True
    settings.EMAIL_DEBUG_MODE = False
    settings.STAFF_NOTIFICATION_EMAILS = TEAM
    settings.FRONTEND_URL = 'https://www.gokidsplay.co.uk'
    sent = []

    def record(self, recipient_email, recipient_name, subject, html_content, reply_to=None):
        sent.append({'to': recipient_email, 'subject': subject, 'reply_to': reply_to, 'html': html_content})
        return f'test-{len(sent)}'

    monkeypatch.setattr(EmailService, '_send_with_fallback', record)
    return sent


def to(outbox, address):
    return [m for m in outbox if m['to'] == address]


def pay(order_id):
    """The customer presses Pay on the test checkout page; the site then verifies it twice
    (the success page and SumUp's webhook both do)."""
    from apps.payments.models import Payment
    client = APIClient(enforce_csrf_checks=False)
    path = f'/api/v1/payments/mock-checkout/{order_id}/'
    assert client.get(path).status_code == 200
    assert client.post(path, {'result': 'pay'}).status_code == 302
    for _ in range(2):
        assert APIClient().post('/api/v1/payments/verify/', {'order_id': order_id}, format='json').status_code == 200
    assert Payment.objects.get(order_id=order_id).status == 'SUCCESS'


def checkout(booking_id, kind, amount=None):
    body = {'booking_id': booking_id, 'booking_type': kind, **({'amount': str(amount)} if amount else {})}
    return APIClient().post('/api/v1/payments/create-order/', body, format='json').data['order_id']


@pytest.mark.django_db
class TestBookingEmails:
    def test_paid_session_confirms_once_and_tells_the_team(self, config, plans, mock_payments, outbox):
        booking = APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data
        assert outbox == []                                   # nothing until it's paid
        pay(checkout(booking['id'], 'session'))
        customer = to(outbox, 'parent@example.com')
        assert len(customer) == 1, [m['subject'] for m in outbox]     # verified twice, e-mailed once
        assert booking['booking_number'] in customer[0]['subject']
        assert customer[0]['reply_to'] == 'info@gokidsplay.co.uk'     # replies reach the team inbox
        team = to(outbox, TEAM)
        assert len(team) == 1 and 'New session booking' in team[0]['subject']
        assert team[0]['reply_to'] == 'parent@example.com'            # the team replies to the customer
        assert '/admin/session-bookings/' in team[0]['html']

    def test_party_deposit_confirms_and_balance_sends_a_receipt(self, config, mock_payments, outbox):
        party = APIClient().post(PARTIES_URL, {**PARTY_PAYLOAD, 'date': next_saturday().isoformat()}, format='json').data
        saved = PartyBooking.objects.get(pk=party['id'])
        pay(checkout(party['id'], 'party', saved.deposit_amount))
        assert [m['subject'] for m in to(outbox, 'party@example.com')][0].startswith('Party booked')
        assert 'deposit paid' in to(outbox, TEAM)[0]['subject']
        pay(checkout(party['id'], 'party'))
        customer = to(outbox, 'party@example.com')
        assert len(customer) == 2 and 'all paid' in customer[1]['subject']
        assert 'balance paid' in to(outbox, TEAM)[1]['subject']

    def test_cancelling_a_paid_booking_emails_customer_and_team(self, config, plans, outbox,
                                                                django_capture_on_commit_callbacks):
        booking = Booking.objects.get(pk=APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data['id'])
        Booking.objects.filter(pk=booking.pk).update(paid_amount=Decimal('10'), payment_status='PARTIAL')
        booking.refresh_from_db()
        booking.booking_status = 'CANCELLED'
        with django_capture_on_commit_callbacks(execute=True):
            booking.save()
        assert 'cancelled' in to(outbox, 'parent@example.com')[0]['subject']
        assert 'Booking cancelled' in to(outbox, TEAM)[0]['subject']
        with django_capture_on_commit_callbacks(execute=True):
            booking.save()                                    # saving again doesn't e-mail again
        assert len(outbox) == 2

    def test_unpaid_online_booking_released_tells_only_the_customer(self, config, plans, outbox,
                                                                    django_capture_on_commit_callbacks):
        from apps.bookings.unpaid import release_unpaid_bookings
        booking_id = APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data['id']
        Booking.objects.filter(pk=booking_id).update(created_at=timezone.now() - timedelta(hours=2))
        with django_capture_on_commit_callbacks(execute=True):
            release_unpaid_bookings()
        assert Booking.objects.get(pk=booking_id).booking_status == 'CANCELLED'
        assert [m['subject'] for m in outbox] == ['Your booking was not completed']

    def test_refund_emails_customer_and_team(self, config, plans, mock_payments, outbox):
        from apps.payments.models import Payment
        from apps.payments.services import payment_service
        booking = APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data
        order_id = checkout(booking['id'], 'session')
        pay(order_id)
        outbox.clear()
        payment_service.process_refund(Payment.objects.get(order_id=order_id).id, reason='Closed for repairs')
        customer = to(outbox, 'parent@example.com')
        assert 'refund' in customer[0]['subject'].lower() and 'Closed for repairs' in customer[0]['html']
        assert 'Refund issued' in to(outbox, TEAM)[0]['subject']


@pytest.mark.django_db
class TestOtherEmails:
    def test_contact_form_reaches_the_team_and_confirms_to_the_customer(self, outbox):
        response = APIClient().post('/api/v1/cms/contact-messages/', {
            'name': 'Sam Parent', 'email': 'sam@example.com', 'phone': '07700900123',
            'message': 'Do you have parking on site?'}, format='json')
        assert response.status_code == 201, response.data
        team = to(outbox, TEAM)
        assert len(team) == 1 and team[0]['reply_to'] == 'sam@example.com'
        assert 'Do you have parking on site?' in team[0]['html']
        assert len(to(outbox, 'sam@example.com')) == 1

    def test_event_request_and_reservation(self, outbox):
        from apps.bookings.models import SpecialEvent
        request = APIClient().post('/api/v1/bookings/public/events/request/', {
            'name': 'Eve Parent', 'email': 'eve@example.com', 'phone': '07700900123', 'event_type': 'CUSTOM',
            'preferred_date': (timezone.localdate() + timedelta(days=30)).isoformat(),
            'num_children': 12, 'num_adults': 4, 'details': 'A superhero morning for a school class'}, format='json')
        assert request.status_code == 201, request.data
        assert "received your event request" in to(outbox, 'eve@example.com')[0]['subject']
        assert 'New event request' in to(outbox, TEAM)[0]['subject']
        event = SpecialEvent.objects.create(title='Halloween', slug='halloween', date=next_saturday(), start_time=time(14),
                                            end_time=time(16), status='PUBLISHED', total_capacity=20,
                                            price_per_child=Decimal('10'), price_per_adult=Decimal('5'))
        APIClient().post('/api/v1/bookings/public/events/book/', {'event_id': event.id, 'num_children': 1, 'num_adults': 1,
                         'name': 'Eve Parent', 'email': 'eve@example.com', 'phone': '07700900123'}, format='json')
        assert 'New event reservation' in to(outbox, TEAM)[1]['subject']

    def test_staff_cancelling_one_event_reservation_tells_the_customer(self, outbox, staff_client):
        from apps.bookings.models import EventBooking, SpecialEvent
        event = SpecialEvent.objects.create(title='Halloween', slug='halloween', date=next_saturday(), start_time=time(14),
                                            end_time=time(16), status='PUBLISHED', total_capacity=20,
                                            price_per_child=Decimal('10'), price_per_adult=Decimal('5'))
        APIClient().post('/api/v1/bookings/public/events/book/', {'event_id': event.id, 'num_children': 1, 'num_adults': 1,
                         'name': 'Eve Parent', 'email': 'eve@example.com', 'phone': '07700900123'}, format='json')
        outbox.clear()
        booking = EventBooking.objects.get(email='eve@example.com')
        for _ in range(2):                                    # cancelling twice e-mails once
            assert staff_client.post(f'/api/v1/bookings/event-bookings/{booking.id}/cancel/').status_code == 200
        customer = to(outbox, 'eve@example.com')
        assert len(customer) == 1 and 'Halloween has been cancelled' in customer[0]['subject']
        assert 'Event reservation cancelled' in to(outbox, TEAM)[0]['subject']

    def test_staff_rescheduling_a_party_tells_the_customer(self, config, outbox, staff_client):
        party = APIClient().post(PARTIES_URL, {**PARTY_PAYLOAD, 'date': next_saturday().isoformat()}, format='json').data
        new_date = next_saturday() + timedelta(days=28)
        response = staff_client.post(f"/api/v1/bookings/party-bookings/{party['id']}/reschedule/",
                                     {'new_date': new_date.isoformat(), 'new_time': '15:00'}, format='json')
        assert response.status_code == 200, response.data
        customer = to(outbox, 'party@example.com')
        assert len(customer) == 1 and 'new date' in customer[0]['subject']
        assert new_date.strftime('%d %B %Y') in customer[0]['html'] and '15:00' in customer[0]['html']
        assert 'Party rescheduled' in to(outbox, TEAM)[0]['subject']

    def test_reminders_go_out_once_the_day_before(self, config, plans, outbox):
        tomorrow = timezone.localdate() + timedelta(days=1)
        booking = Booking.objects.get(pk=APIClient().post(SESSIONS_URL, session_payload(plans), format='json').data['id'])
        Booking.objects.filter(pk=booking.pk).update(date=tomorrow, payment_status='PAID', booking_status='CONFIRMED')
        call_command('send_booking_reminders')
        call_command('send_booking_reminders')
        reminders = to(outbox, 'parent@example.com')
        assert len(reminders) == 1 and 'See you tomorrow' in reminders[0]['subject']

    def test_azure_message_carries_reply_to(self, settings, monkeypatch):
        from apps.emails.services import EmailService
        captured = {}

        class FakePoller:
            def result(self):
                return {'id': 'azure-1'}

        class FakeClient:
            def begin_send(self, message):
                captured.update(message)
                return FakePoller()

        import azure.communication.email as acs
        monkeypatch.setattr(acs.EmailClient, 'from_connection_string', staticmethod(lambda s: FakeClient()))
        service = EmailService()
        service.connection_string = 'endpoint=https://x.communication.azure.com/;accesskey=eA=='
        service.sender_address = 'DoNotReply@example.azurecomm.net'
        assert service._send_via_azure('a@example.com', 'Hi', '<p>Hi</p>', reply_to='info@gokidsplay.co.uk') == 'azure-1'
        assert captured['replyTo'] == [{'address': 'info@gokidsplay.co.uk'}]
