"""
Admin activity log (Admin → Activity Logs).

AdminActivityMiddleware records, after the response:
  - every successful change (POST / PUT / PATCH / DELETE) made by a signed-in
    staff user through /api/v1/… — who, what, which record, the fields sent
    (passwords and keys redacted), IP address and browser
  - every admin sign-in to /api/token/, successful or not

Customers' bookings, payment checks and other public requests are not logged
(their own records — bookings, payments — already keep that history).
"""
import json
import logging
import re

logger = logging.getLogger(__name__)

WRITE_METHODS = {'POST', 'PUT', 'PATCH', 'DELETE'}
SECRET_KEYS = re.compile(r'pass|token|secret|key|card|cvv', re.I)

# Requests that are not admin changes (public, automatic or read-like)
SKIP = re.compile(
    r'^/api/v1/(payments/(auto-verify|verify|create-order|sumup-webhook|reverify)|'
    r'bookings/(customer-auth|public)/|cms/contact-messages/?$|core/notifications|'
    r'core/admin/search|bookings/.*/check_duplicate)'
)

# /api/v1/<app>/<resource>/ → what staff call it
ENTITIES = {
    'bookings/bookings': 'Session booking',
    'bookings/party-bookings': 'Party booking',
    'bookings/party-bookings-old': 'Party booking',
    'bookings/booking-blocks': 'Opening day change',
    'bookings/events': 'Special event',
    'bookings/event-bookings': 'Event reservation',
    'bookings/event-requests': 'Event request',
    'bookings/customers': 'Customer',
    'bookings/transactions': 'Transaction',
    'payments/refund': 'Payment refund',
    'payments': 'Payment',
    'shop/vouchers': 'Voucher',
    'core/users': 'Admin user',
    'core/settings': 'Site settings',
    'core/logos': 'Logo',
    'invitations/templates': 'Invitation design',
    'invitations/invitations': 'Party invitation',
    'emails/resend-confirmation': 'Confirmation e-mail',
    'cms/google-reviews': 'Google reviews',
    'cms/upload': 'Uploaded file',
    'cms/session-booking-config': 'Session booking settings',
    'cms/party-booking-config': 'Party booking settings',
    'cms/page-sections': 'Page content',
    'cms/pricing-plans': 'Ticket price',
    'cms/testimonials': 'Customer review',
    'cms/timing-cards': 'Opening hours card',
    'cms/booking-information': 'Booking information',
}


def _client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    return (forwarded.split(',')[0].strip() if forwarded else request.META.get('REMOTE_ADDR')) or None


def _describe(path: str, method: str):
    """(entity, entity_id, action, verb) from an API path."""
    parts = [p for p in path[len('/api/v1/'):].strip('/').split('/') if p]
    entity_key, rest = None, []
    for size in (2, 1):
        key = '/'.join(parts[:size])
        if key in ENTITIES:
            entity_key, rest = key, parts[size:]
            break
    if entity_key:
        entity = ENTITIES[entity_key]
    elif parts[:1] == ['cms'] and len(parts) > 1:
        entity = 'Website content: ' + parts[1].replace('-', ' ')
        rest = parts[2:]
    else:
        entity = ' '.join(parts[:2]).replace('-', ' ').capitalize() or 'API'
        rest = parts[2:]
    # /<id>/<verb>/ or /<verb>/ after the resource (ids are numbers or uuids)
    is_id = bool(rest) and bool(re.fullmatch(r'\d+|[0-9a-f-]{32,36}', rest[0]))
    entity_id = rest[0] if is_id else ''
    verbs = rest[1:] if is_id else rest
    verb = verbs[0] if verbs else ''
    if method == 'DELETE':
        action = 'DELETE'
    elif method in ('PUT', 'PATCH'):
        action = 'UPDATE'
    elif verb:
        action = 'ACTION'
    else:
        action = 'CREATE'
    return entity, entity_id, action, verb


def _safe_fields(body: bytes, content_type: str) -> dict:
    if not body or 'application/json' not in (content_type or ''):
        return {}
    try:
        data = json.loads(body.decode('utf-8'))
    except (ValueError, UnicodeDecodeError):
        return {}
    if not isinstance(data, dict):
        return {}
    out = {}
    for key, value in list(data.items())[:40]:
        if SECRET_KEYS.search(str(key)):
            out[key] = '••••'
        elif isinstance(value, (dict, list)):
            out[key] = json.dumps(value)[:200]
        else:
            out[key] = str(value)[:200]
    return out


class AdminActivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        method = request.method
        path = request.path
        watch = method in WRITE_METHODS and (path.startswith('/api/v1/') or path == '/api/token/') and not SKIP.match(path)
        body = b''
        if watch:
            try:
                body = request.body if int(request.META.get('CONTENT_LENGTH') or 0) < 1_000_000 else b''
            except Exception:
                body = b''
        response = self.get_response(request)
        if watch:
            try:
                self._record(request, response, path, method, body)
            except Exception:  # never break a request because of logging
                logger.exception('Could not record admin activity')
        return response

    def _record(self, request, response, path, method, body):
        from .models import AdminActivity
        common = {
            'method': method, 'path': path[:500], 'status_code': response.status_code,
            'ip_address': _client_ip(request), 'user_agent': request.META.get('HTTP_USER_AGENT', '')[:300],
        }

        if path == '/api/token/':
            email = ''
            try:
                email = str(json.loads(body.decode('utf-8')).get('email', ''))[:255]
            except Exception:
                pass
            ok = response.status_code == 200
            user = None
            if ok:
                from django.contrib.auth import get_user_model
                user = get_user_model().objects.filter(email__iexact=email).first()
            AdminActivity.objects.create(
                user=user, user_email=email, user_name=getattr(user, 'name', '') if user else '',
                action='LOGIN' if ok else 'LOGIN_FAILED', entity='Admin portal',
                summary='Signed in' if ok else 'Wrong e-mail or password', **common)
            return

        user = getattr(request, 'user', None)
        if not (user and user.is_authenticated and user.is_staff) or response.status_code >= 400:
            return
        entity, entity_id, action, verb = _describe(path, method)
        if not entity_id:
            data = getattr(response, 'data', None)
            if isinstance(data, dict) and data.get('id') is not None:
                entity_id = str(data['id'])
        label = (getattr(response, 'data', None) or {}) if isinstance(getattr(response, 'data', None), dict) else {}
        reference = label.get('booking_number') or label.get('booking_reference') or label.get('reference') or ''
        words = {'CREATE': 'Created', 'UPDATE': 'Updated', 'DELETE': 'Deleted'}
        summary = (f"{verb.replace('_', ' ').replace('-', ' ').capitalize()}" if action == 'ACTION' and verb
                   else words.get(action, 'Changed')) + f" {entity.lower()}" + (f" {reference}" if reference else (f" #{entity_id}" if entity_id else ''))
        AdminActivity.objects.create(
            user=user, user_email=getattr(user, 'email', ''), user_name=getattr(user, 'name', '') or '',
            action=action, entity=entity, entity_id=entity_id[:100], summary=summary[:500],
            details={'fields': _safe_fields(body, request.META.get('CONTENT_TYPE', ''))}, **common)
