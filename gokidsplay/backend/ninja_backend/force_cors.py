"""
CORS middleware - adds Access-Control-Allow-* headers for the site's own origins.

Only origins listed in settings.CORS_ALLOWED_ORIGINS get CORS headers. Responses
carry Allow-Credentials, so reflecting any other origin would let third-party
websites make logged-in requests and read the replies.
"""
from django.conf import settings
from django.http import HttpResponse
from django.utils.cache import patch_vary_headers


class ForceCORSMiddleware:
    """Adds CORS headers for allowed origins and answers preflight OPTIONS requests."""
    ALLOWED_HEADERS = "Content-Type, Authorization, X-CSRFToken, Accept, Origin, User-Agent, DNT"
    ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"

    def __init__(self, get_response):
        self.get_response = get_response
        self.allowed_origins = {o.rstrip('/') for o in getattr(settings, 'CORS_ALLOWED_ORIGINS', [])}

    def __call__(self, request):
        # Handle preflight OPTIONS immediately — don't pass to Django's view layer
        if request.method == "OPTIONS":
            response = HttpResponse(status=200)
            self._add_cors(request, response)
            return response

        response = self.get_response(request)
        self._add_cors(request, response)
        return response

    def _add_cors(self, request, response):
        origin = (request.headers.get("Origin") or "").rstrip('/')
        if not origin or origin not in self.allowed_origins:
            return
        response["Access-Control-Allow-Origin"] = origin
        patch_vary_headers(response, ("Origin",))
        response["Access-Control-Allow-Methods"] = self.ALLOWED_METHODS
        response["Access-Control-Allow-Headers"] = self.ALLOWED_HEADERS
        response["Access-Control-Allow-Credentials"] = "true"
        response["Access-Control-Max-Age"] = "86400"
