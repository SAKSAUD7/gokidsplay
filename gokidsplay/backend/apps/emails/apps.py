from django.apps import AppConfig


class EmailsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.emails'
    verbose_name = 'Email System'
    
    def ready(self):
        """Import signals when app is ready"""
        try:
            import apps.emails.signals  # noqa
        except ImportError:
            pass
