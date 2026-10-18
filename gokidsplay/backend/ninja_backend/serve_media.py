from django.core.files.storage import default_storage
from django.core.exceptions import SuspiciousFileOperation
from django.http import FileResponse, Http404
import mimetypes
import logging

logger = logging.getLogger(__name__)


def serve_media_proxy(request, path):
    """Uploaded files from Azure Blob storage, streamed (not loaded into memory)."""
    if '..' in path.split('/') or path.startswith('/'):
        raise Http404("Media not found")
    try:
        if not default_storage.exists(path):
            raise Http404("Media not found")
        content_type, _ = mimetypes.guess_type(path)
        response = FileResponse(default_storage.open(path), content_type=content_type or 'application/octet-stream')
        response['Cache-Control'] = 'public, max-age=86400'
        return response
    except Http404:
        raise
    except (SuspiciousFileOperation, Exception) as e:
        logger.error(f"Error serving media {path}: {str(e)}")
        raise Http404("Media not found")
