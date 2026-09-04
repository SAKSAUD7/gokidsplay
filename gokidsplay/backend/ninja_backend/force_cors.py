"""
Force CORS middleware - explicitly injects Access-Control-Allow-Origin on every response.
This bypasses any django-cors-headers config conflicts and is guaranteed to work.
"""
from django.http import HttpResponse


class ForceCORSMiddleware:
    """
    Nuclear CORS middleware. Adds CORS headers to EVERY response unconditionally.
    Handles preflight OPTIONS requests too.
    """
    ALLOWED_HEADERS = "Content-Type, Authorization, X-CSRFToken, Accept, Origin, User-Agent, DNT"
    ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"

    def __init__(self, get_response):
        self.get_response = get_response

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
        origin = request.headers.get("Origin")
        if origin:
            response["Access-Control-Allow-Origin"] = origin
        else:
            response["Access-Control-Allow-Origin"] = "https://spinpin-frontend-d7ftbvf8h8cxe9g5.centralus-01.azurewebsites.net"
            
        response["Access-Control-Allow-Methods"] = self.ALLOWED_METHODS
        response["Access-Control-Allow-Headers"] = self.ALLOWED_HEADERS
        response["Access-Control-Allow-Credentials"] = "true"
        response["Access-Control-Max-Age"] = "86400"
