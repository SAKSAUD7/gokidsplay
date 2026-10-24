"""
Scheduled jobs, triggered over HTTPS (the GitHub Actions workflow
.github/workflows/scheduled-jobs.yml calls this every 15 minutes and once a day).

POST /api/v1/core/cron/?job=frequent|daily   header  X-Cron-Secret: <CRON_SECRET>

frequent — release unpaid online bookings (frees their places)
         — re-check SumUp payments still waiting for an answer
daily    — refresh Google rating, reviews and photos; thank-you e-mails; tomorrow's reminders
         — send yesterday's visitors the thank-you e-mail
"""
import hmac
import io
import logging

from django.conf import settings
from django.core.management import call_command
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

logger = logging.getLogger(__name__)


def _run(results: dict, name: str, fn):
    try:
        results[name] = fn()
    except Exception as exc:  # one failing job must not stop the others
        logger.exception('Scheduled job %s failed', name)
        results[name] = f'failed: {exc}'


def _command(name):
    out = io.StringIO()
    call_command(name, stdout=out)
    return out.getvalue().strip()[-500:]


def _reverify_payments():
    from datetime import timedelta
    from django.utils import timezone
    from apps.payments.models import Payment
    from apps.payments.services import payment_service
    pending = Payment.objects.filter(provider='SUMUP', status='CREATED',
                                     created_at__gte=timezone.now() - timedelta(days=7))[:50]
    paid = 0
    for payment in pending:
        result = payment_service.verify_and_complete_payment(order_id=payment.order_id,
                                                             payment_data={'order_id': payment.order_id})
        paid += result.get('payment_status') == 'PAID'
    return f'checked {len(pending)}, newly paid {paid}'


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])  # protected by the shared secret below
def run_scheduled_jobs(request):
    secret = getattr(settings, 'CRON_SECRET', '')
    given = request.headers.get('X-Cron-Secret', '')
    if not secret or not hmac.compare_digest(secret, given):
        return Response({'error': 'Not allowed'}, status=403)

    job = request.query_params.get('job', 'frequent')
    results = {}
    if job == 'frequent':
        from apps.bookings.unpaid import release_unpaid_bookings
        _run(results, 'release_unpaid_bookings', release_unpaid_bookings)
        if getattr(settings, 'SUMUP_API_KEY', ''):
            _run(results, 'reverify_payments', _reverify_payments)
    elif job == 'daily':
        from apps.cms.google_reviews import api_key, sync_google_reviews
        if api_key():
            _run(results, 'sync_google_reviews', sync_google_reviews)
        _run(results, 'send_post_visit_emails', lambda: _command('send_post_visit_emails'))
        _run(results, 'send_booking_reminders', lambda: _command('send_booking_reminders'))
    else:
        return Response({'error': 'job must be "frequent" or "daily"'}, status=400)
    logger.info('Scheduled jobs (%s): %s', job, results)
    return Response({'job': job, 'results': {k: str(v) for k, v in results.items()}})
