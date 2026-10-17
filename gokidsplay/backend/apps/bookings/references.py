"""
Booking numbers: short, unique and easy to read out at the desk or over the phone.

    GK + 6 digits   play session        e.g. GK482913
    GP + 6 digits   party               e.g. GP105377
    EV + 6 digits   event reservation   e.g. EV730214
    ER + 6 digits   event request       e.g. ER661508

The number is shown on the confirmation screen, the e-mail and the e-ticket, and
the admin portal finds a booking (and its payments) by it. Older bookings keep
the numbers they were given (e.g. SP-12).
"""
import re
import secrets

SESSION_PREFIX = 'GK'
PARTY_PREFIX = 'GP'
EVENT_PREFIX = 'EV'
EVENT_REQUEST_PREFIX = 'ER'


def new_reference(prefix: str, model, field: str = 'booking_number', digits: int = 6) -> str:
    """A random, unused reference such as GK482913 (random so numbers can't be guessed)."""
    low = 10 ** (digits - 1)
    for _ in range(20):
        ref = f"{prefix}{low + secrets.randbelow(9 * low)}"
        if not model.objects.filter(**{field: ref}).exists():
            return ref
    return new_reference(prefix, model, field, digits + 1)


def normalise_reference(text: str) -> str:
    """'gk 482-913' or '#GK482913' → 'GK482913', for searching."""
    return re.sub(r'[\s#\-]', '', text or '').upper()
