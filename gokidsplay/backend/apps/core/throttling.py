"""
Anonymous rate limits, split by request type.

Every public page reads site content (logo, alerts, pricing plans, page
sections) from the API, and server-side renders all come from the frontend
server's single IP. Reads therefore get a generous limit, while writes
(bookings, logins, contact forms) keep a strict one.
"""
from rest_framework.permissions import SAFE_METHODS
from rest_framework.throttling import AnonRateThrottle


class AnonReadThrottle(AnonRateThrottle):
    scope = 'anon_read'

    def allow_request(self, request, view):
        if request.method not in SAFE_METHODS:
            return True
        return super().allow_request(request, view)


class AnonWriteThrottle(AnonRateThrottle):
    scope = 'anon_write'

    def allow_request(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return super().allow_request(request, view)
