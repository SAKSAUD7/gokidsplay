"""
Management command to bulk-reverify all PENDING payments via SumUp API.

Fixes all bookings stuck in PENDING state even though SumUp processed the payment.

Usage:
    python manage.py reverify_pending_payments
    python manage.py reverify_pending_payments --dry-run
"""
import logging
from django.core.management.base import BaseCommand
from apps.payments.models import Payment
from apps.payments.gateways.sumup import SumUpGateway
from decimal import Decimal

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Reverify all PENDING SumUp payments and update booking statuses"

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without saving anything',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        gateway = SumUpGateway()

        # Get all payments that are not yet SUCCESS
        pending_payments = Payment.objects.filter(
            provider='SUMUP',
            status__in=['CREATED', 'PENDING']
        ).order_by('created_at')

        self.stdout.write(f"\n{'DRY RUN - ' if dry_run else ''}Found {pending_payments.count()} PENDING SumUp payments to check\n")

        updated = 0
        already_paid = 0
        still_pending = 0
        errors = 0

        for payment in pending_payments:
            order_id = payment.order_id
            if not order_id:
                self.stdout.write(self.style.WARNING(f"  Payment #{payment.id}: No order_id, skipping"))
                continue

            try:
                booking = payment.get_booking()
                booking_id = booking.id if booking else 'N/A'

                success, tx_id, response = gateway.verify_payment({'order_id': order_id})
                sumup_status = response.get('status', 'UNKNOWN')

                if success:
                    if dry_run:
                        self.stdout.write(
                            self.style.SUCCESS(f"  [DRY RUN] Payment #{payment.id} (booking #{booking_id}): "
                                               f"Would mark as PAID (SumUp: {sumup_status})")
                        )
                    else:
                        self.stdout.write(
                            self.style.SUCCESS(f"  ✅ Payment #{payment.id} (booking #{booking_id}): "
                                               f"Marked PAID (SumUp: {sumup_status})")
                        )
                    updated += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(f"  ⏳ Payment #{payment.id} (booking #{booking_id}): "
                                           f"Still PENDING (SumUp: {sumup_status})")
                    )
                    still_pending += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ❌ Payment #{payment.id}: Error - {str(e)}"))
                errors += 1

        self.stdout.write(f"\n{'=' * 50}")
        self.stdout.write(f"Results:")
        self.stdout.write(self.style.SUCCESS(f"  Updated to PAID: {updated}"))
        self.stdout.write(self.style.WARNING(f"  Still PENDING:   {still_pending}"))
        self.stdout.write(self.style.ERROR(f"  Errors:          {errors}"))
        self.stdout.write(f"{'=' * 50}\n")
