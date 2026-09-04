from django.core.management.base import BaseCommand
from apps.marketing.services import marketing_service

class Command(BaseCommand):
    help = 'Sends automated daily birthday emails to participants 20 days before their birthday.'

    def handle(self, *args, **options):
        self.stdout.write("Starting Daily Birthday Email Batch...")
        try:
            marketing_service.send_birthday_batch()
            self.stdout.write(self.style.SUCCESS("Successfully processed birthday emails"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to process birthday emails: {str(e)}"))
