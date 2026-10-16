"""
Anonymous rate limits, split by request type.

Every public page reads site content (logo, alerts, pricing plans, page
sections) from the API, and server-side renders all come from the frontend
server's single IP. Reads therefore get a generous limit, while writes
(bookings, logins, contact forms) keep a strict one.
"""
from django.conf import settings
from rest_framework.permissions import SAFE_METHODS
from rest_framework.throttling import AnonRateThrottle


def client_ip(request) -> str:
    """
    The visitor's IP for rate limiting.

    X-Forwarded-For can be set by anyone, so only the entries added by our own
    proxies are trusted (TRUSTED_PROXY_COUNT: 0 locally, 1 behind Azure's front
    end). Azure appends "ip:port", so the port is removed.
    """
    remote_addr = request.META.get('REMOTE_ADDR', '')
    count = getattr(settings, 'TRUSTED_PROXY_COUNT', 0)
    xff = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if count <= 0 or not xff:
        return remote_addr
    entries = [e.strip() for e in xff.split(',') if e.strip()]
    if not entries:
        return remote_addr
    ip = entries[-min(count, len(entries))]
    if ip.startswith('['):                      # [IPv6]:port
        return ip[1:ip.index(']')] if ']' in ip else ip
    if ip.count(':') == 1:                      # IPv4:port
        return ip.split(':')[0]
    return ip


class _ClientIPMixin:
    def get_ident(self, request):
        return client_ip(request)


class AnonReadThrottle(_ClientIPMixin, AnonRateThrottle):
    scope = 'anon_read'

    def allow_request(self, request, view):
        if request.method not in SAFE_METHODS:
            return True
        return super().allow_request(request, view)


class AnonWriteThrottle(_ClientIPMixin, AnonRateThrottle):
    scope = 'anon_write'

    def allow_request(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return super().allow_request(request, view)
