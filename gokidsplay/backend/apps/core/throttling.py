"""
Anonymous rate limits, split by request type.

Every public page reads site content (logo, alerts, pricing plans, page
sections) from the API, and server-side renders all come from the frontend
server's single IP. Reads therefore get a generous limit, while writes
(bookings, logins, contact forms) keep a strict one.
"""
import hmac

from django.conf import settings
from rest_framework.permissions import SAFE_METHODS
from rest_framework.throttling import AnonRateThrottle


def client_ip(request) -> str:
    """
    The visitor's IP for rate limiting.

    Bookings, voucher checks and payments are sent by the website's own server
    (Next.js server actions), so every customer would look like one visitor. The
    website passes the customer's IP in X-Forwarded-Client-IP, signed with the
    shared INTERNAL_PROXY_SECRET; it is only trusted when the secret matches.
    """
    secret = getattr(settings, 'INTERNAL_PROXY_SECRET', '')
    forwarded = request.META.get('HTTP_X_FORWARDED_CLIENT_IP', '').strip()
    if secret and forwarded and hmac.compare_digest(secret, request.META.get('HTTP_X_PROXY_SECRET', '')):
        return forwarded[:64]
    return _network_ip(request)


def _network_ip(request) -> str:
    """
    The connecting IP.

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


class VoucherCheckThrottle(_ClientIPMixin, AnonRateThrottle):
    """Voucher codes can't be guessed quickly: 10 checks a minute per visitor."""
    scope = 'voucher_check'

    def allow_request(self, request, view):
        if request.user and request.user.is_authenticated and request.user.is_staff:
            return True
        return super().allow_request(request, view)


class LoginThrottle(_ClientIPMixin, AnonRateThrottle):
    """Sign-in, sign-up and password reset: 10 tries a minute per visitor (stops password guessing)."""
    scope = 'login'

    def allow_request(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return super().allow_request(request, view)


class AnonWriteThrottle(_ClientIPMixin, AnonRateThrottle):
    scope = 'anon_write'

    def allow_request(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return super().allow_request(request, view)
