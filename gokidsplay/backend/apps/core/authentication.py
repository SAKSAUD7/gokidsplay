from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import CSRFCheck
from rest_framework import exceptions


class JWTCookieAuthentication(JWTAuthentication):
    """
    Custom JWT authentication class that reads the token from cookies
    instead of the Authorization header.
    """
    
    def authenticate(self, request):
        # First try to get token from cookie
        raw_token = request.COOKIES.get('admin_token')
        
        if raw_token is None:
            # Fallback to header-based authentication
            return super().authenticate(request)
        
        # Validate the token
        validated_token = self.get_validated_token(raw_token)
        
        # Enforce CSRF check for cookie-based auth
        self.enforce_csrf(request)
        
        # Get the user from the validated token
        return self.get_user(validated_token), validated_token
    
    def enforce_csrf(self, request):
        """
        A browser sends cookies automatically, so a change made with the cookie
        (POST, PATCH, DELETE…) must carry a CSRF token, as Django's own forms do.
        The website's server calls the API with an Authorization header instead,
        which is not affected.
        """
        if request.method in ('GET', 'HEAD', 'OPTIONS', 'TRACE'):
            return

        def get_response(_request):  # CSRFCheck needs a response callable (unused)
            return None

        check = CSRFCheck(get_response)
        check.process_request(request)
        reason = check.process_view(request, None, (), {})
        if reason:
            raise exceptions.PermissionDenied('CSRF Failed: %s' % reason)
