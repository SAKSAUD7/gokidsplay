"""
Uploads live in a private Azure Blob container. Files are shown to visitors through
the backend's /media/ route (serve_media.py), so their address is /media/<name>
rather than the blob address (which a private container refuses).
"""
from django.conf import settings
from django.utils.encoding import filepath_to_uri
from storages.backends.azure_storage import AzureStorage


class ProxiedAzureStorage(AzureStorage):
    def url(self, name, *args, **kwargs):
        return f"{settings.MEDIA_URL}{filepath_to_uri(str(name).lstrip('/'))}"
