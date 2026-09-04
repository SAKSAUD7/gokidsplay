from django.core.management.base import BaseCommand
from apps.bookings.models import Waiver

class Command(BaseCommand):
    help = 'Clean up minor waiver records that should be in the minors JSON field'

    def handle(self, *args, **options):
        # Delete all waiver records with participant_type='MINOR'
        minor_waivers = Waiver.objects.filter(participant_type='MINOR')
        count = minor_waivers.count()
        
        self.stdout.write(f'Found {count} minor waiver records to delete')
        
        if count > 0:
            minor_waivers.delete()
            self.stdout.write(self.style.SUCCESS(f'Successfully deleted {count} minor waiver records'))
            self.stdout.write(self.style.WARNING('Please re-submit waivers for party bookings to properly store minors'))
        else:
            self.stdout.write(self.style.SUCCESS('No minor waiver records found'))
