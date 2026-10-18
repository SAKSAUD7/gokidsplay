from django.core.management.base import BaseCommand

from apps.bookings.unpaid import HOLD_MINUTES, release_unpaid_bookings


class Command(BaseCommand):
    help = f"Cancel online bookings left unpaid for more than {HOLD_MINUTES} minutes (frees their places)"

    def handle(self, *args, **options):
        released = release_unpaid_bookings()
        self.stdout.write(f"Released {released['sessions']} session and {released['parties']} party bookings")
