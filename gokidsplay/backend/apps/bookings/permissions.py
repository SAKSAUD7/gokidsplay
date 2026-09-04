"""
Custom permissions for the Ninja Inflatable Park application.
"""
from rest_framework import permissions


class IsStaffUser(permissions.BasePermission):
    """
    Permission class that allows access to ADMIN and STAFF roles.
    This is used for operational features like bookings, waivers, customers, etc.
    
    Allowed roles: ADMIN, STAFF
    """
    def has_permission(self, request, view):
        # Allow access if user is authenticated and has ADMIN or STAFF role
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_staff
        )


class IsSuperAdminOnly(permissions.BasePermission):
    """
    Permission class that only allows ADMIN role.
    This is used for sensitive features like user management, settings, etc.
    
    Allowed roles: ADMIN only
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'ADMIN'
        )
