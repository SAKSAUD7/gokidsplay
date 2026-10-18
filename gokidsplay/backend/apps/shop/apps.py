from django.apps import AppConfig


class ShopConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.shop'

    def ready(self):
        from . import signals  # noqa: F401  voucher uses follow booking cancellations
