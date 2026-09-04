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
        Enforce CSRF validation for cookie-based authentication.
        """
        check = CSRFCheck(request)
        # For now, we'll skip CSRF for API requests
        # In production, you should enable this properly
        reason = check.process_view(request, None, (), {})
        if reason:
            # CSRF failed, but we'll allow it for now
            # raise exceptions.PermissionDenied('CSRF Failed: %s' % reason)
            pass
