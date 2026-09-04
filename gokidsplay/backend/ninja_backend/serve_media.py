from django.core.files.storage import default_storage
from django.http import HttpResponse, Http404
import mimetypes
import logging

logger = logging.getLogger(__name__)

def serve_media_proxy(request, path):
    try:
        # Django's default storage can read from Azure Blob if configured
        if not default_storage.exists(path):
            raise Http404("Media not found")
        
        file = default_storage.open(path)
        content_type, _ = mimetypes.guess_type(path)
        if not content_type:
            content_type = 'application/octet-stream'
            
        return HttpResponse(file.read(), content_type=content_type)
    except Exception as e:
        logger.error(f"Error serving media {path}: {str(e)}")
        raise Http404(str(e))
