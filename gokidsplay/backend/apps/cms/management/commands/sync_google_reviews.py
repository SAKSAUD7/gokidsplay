from django.core.management.base import BaseCommand, CommandError

from apps.cms.google_reviews import GoogleReviewsError, sync_google_reviews


class Command(BaseCommand):
    help = "Fetch the Go Kids Play Google rating and latest reviews (needs GOOGLE_PLACES_API_KEY)"

    def handle(self, *args, **options):
        try:
            result = sync_google_reviews()
        except GoogleReviewsError as exc:
            raise CommandError(str(exc))
        self.stdout.write(f"Google: {result['rating']}★ from {result['review_count']} reviews — "
                          f"{result['created']} new, {result['updated']} updated")
