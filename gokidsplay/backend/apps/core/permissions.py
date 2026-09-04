from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Permission class for ADMIN role.
    Grants full access to everything.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'

class IsStaffOrAdmin(permissions.BasePermission):
    """
    Permission class for STAFF and ADMIN roles.
    Grants access to booking management.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['STAFF', 'ADMIN']
        )

class IsContentManagerOrAdmin(permissions.BasePermission):
    """
    Permission class for CONTENT_MANAGER and ADMIN roles.
    Grants access to CMS features.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['CONTENT_MANAGER', 'ADMIN']
        )

class IsManagerOrAdmin(permissions.BasePermission):
    """
    Permission class for MANAGER and ADMIN roles.
    Grants access to management features.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['MANAGER', 'ADMIN']
        )
