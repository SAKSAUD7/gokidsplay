# EMAIL SETUP GUIDE — SpinPin Platform
## For Hosting Team

---

## Quick Start

The email service is in `backend/services/email_service.py`. All you need is to configure the SMTP settings in `backend/.env`.

---

## Option 1: Gmail (Recommended for Small Volume)

1. Go to https://myaccount.google.com/apppasswords
2. Create an App Password for "Mail"
3. Add to `backend/.env`:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=spinpin@gmail.com
EMAIL_HOST_PASSWORD=xxxx-xxxx-xxxx-xxxx   ← App password (16 chars, no spaces)
DEFAULT_FROM_EMAIL=SpinPin Leicester <spinpin@gmail.com>
ADMIN_EMAIL=admin@spinpin.co.uk
```

---

## Option 2: SendGrid (Recommended for Production)

1. Create account at https://sendgrid.com
2. Generate an API Key with "Mail Send" permissions
3. Add to `backend/.env`:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEFAULT_FROM_EMAIL=SpinPin Leicester <noreply@spinpin.co.uk>
ADMIN_EMAIL=info@spinpin.co.uk
```

---

## Option 3: Mailgun

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=postmaster@mg.spinpin.co.uk
EMAIL_HOST_PASSWORD=your-mailgun-smtp-password
DEFAULT_FROM_EMAIL=SpinPin Leicester <noreply@spinpin.co.uk>
ADMIN_EMAIL=info@spinpin.co.uk
```

---

## Option 4: Console (Local Development)

No emails sent — just prints to terminal. Use this for development:

```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

---

## Django Settings Configuration

These settings in `ninja_backend/settings.py` read from `.env`:

```python
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'SpinPin Leicester <noreply@spinpin.co.uk>')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'info@spinpin.co.uk')
```

---

## What Emails Are Sent

| Trigger | Recipient | Template |
|---|---|---|
| New party booking | Customer | HTML branded confirmation |
| New party booking | Admin (`ADMIN_EMAIL`) | Plain text alert with all details |
| New session booking | Customer | Plain text confirmation |

---

## Testing Email

Run this in the Django shell to test:

```bash
cd backend
python manage.py shell

>>> from services.email_service import EmailService
>>> # Create a mock booking object
>>> class MockBooking:
...     id = 1; name = "Test User"; email = "your@email.com"
...     phone = "07700900000"; date = "2026-07-15"; time = "14:00:00"
...     package_name = "STANDARD"; kids = 12; adults = 4
...     amount = 180.00; paid_amount = 0; birthday_child_name = "Ella"
...     birthday_child_age = 8; special_requests = "Nut allergy"
...     dietary_restrictions = None; booking_number = "SPPARTY-20260715-0001"
...     status = "PENDING"
>>> result = EmailService.send_party_booking_confirmation(MockBooking())
>>> print("Sent:", result)
```

---

## Triggering Emails from Views

```python
from services.email_service import send_party_confirmation

# In your party booking create view, after saving:
party_booking = serializer.save()
send_party_confirmation(party_booking)
```

---

## Common Issues

| Problem | Fix |
|---|---|
| `SMTPAuthenticationError` | Check `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD`. For Gmail, ensure App Passwords are enabled (not your main password). |
| `Connection refused` | Check `EMAIL_HOST` and `EMAIL_PORT`. Ensure firewall allows outbound port 587. |
| Emails go to spam | Set up DKIM/SPF records for your domain. Use a proper `FROM` domain. |
| `No module named 'services'` | Ensure `backend/services/__init__.py` exists. |
