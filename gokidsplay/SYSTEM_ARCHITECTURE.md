# SYSTEM ARCHITECTURE — SpinPin Platform
## Last Updated: June 2026

---

## Overview

SpinPin is a full-stack party and leisure booking platform for Spin Pin Leicester. It consists of:

- **Frontend**: Next.js 14 (App Router) — port `5000` (dev)
- **Backend**: Django 5.1 + Django REST Framework — port `9000` (dev)
- **Database**: PostgreSQL (production) / SQLite (local dev)
- **Admin**: Custom Next.js Admin Portal + Django Admin (`/django-admin/`)

---

## Repository Structure

```
spinpin/
├── frontend/               # Next.js 14 App Router
│   ├── app/
│   │   ├── (main)/         # Public-facing pages
│   │   │   ├── party-booking/   ← PartyBookingWizard (5-step flow)
│   │   │   ├── parties/         ← Party packages showcase
│   │   │   ├── booking/         ← Session booking
│   │   │   └── tickets/[id]/    ← Ticket viewer
│   │   ├── (admin-portal)/admin/  ← Custom admin UI
│   │   ├── actions/        # Next.js Server Actions
│   │   │   ├── createPartyBooking.ts
│   │   │   └── createBooking.ts
│   │   └── api/            # Next.js API routes (proxy to backend)
│   ├── components/
│   │   ├── PartyBookingPDF.tsx   ← PDF generation (jsPDF)
│   │   ├── GlobalErrorBoundary.tsx
│   │   ├── PaymentStep.tsx
│   │   └── SmartCalendar.tsx
│   └── packages/ui/        # Shared component library (@repo/ui)
│       └── src/components/
│           ├── ImageCarousel.tsx
│           └── ...
│
├── backend/               # Django REST Framework
│   ├── apps/
│   │   ├── bookings/       # Core booking models & API
│   │   │   ├── models.py   ← Booking, PartyBooking, Waiver, etc.
│   │   │   ├── views.py    ← REST endpoints
│   │   │   ├── serializers.py
│   │   │   ├── admin.py    ← Django admin configuration
│   │   │   └── migrations/ ← Database schema history
│   │   ├── payments/       # SumUp payment gateway
│   │   ├── cms/            # CMS content (logos, alerts, party config)
│   │   └── core/           # Auth, settings, users
│   ├── services/
│   │   └── email_service.py  ← Centralised email layer (NEW)
│   ├── ninja_backend/
│   │   └── settings.py     ← Django settings (CORS, DB, SMTP)
│   └── startup.sh          ← Production startup script
```

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/bookings/party-bookings/` | Create party booking |
| GET | `/api/v1/bookings/party-bookings/` | List all party bookings |
| GET | `/api/v1/bookings/party-bookings/{id}/` | Get single party booking |
| POST | `/api/v1/bookings/party-bookings/{uuid}/participants` | Add participants |
| GET | `/api/v1/bookings/booking-blocks/` | Get blocked dates |
| GET | `/api/v1/cms/party-config/` | Get pricing config |
| POST | `/api/v1/payments/sumup/initiate/` | Initiate payment |

---

## Data Flow: Party Booking

```
User fills form (Step 1)
       ↓
createPartyBooking.ts (Server Action)
       ↓
POST /api/v1/bookings/party-bookings/
       ↓
PartyBookingSerializer.create()
  - Auto-creates Customer record
  - Validates date not blocked
  - Stores: name, email, phone, date, time, package_name,
            kids, adults, spectators, amount, special_requests,
            dietary_restrictions, birthday_child_name/age
       ↓
Returns booking UUID → stored in wizard state
       ↓
Step 2: ParticipantCollection
  POST /api/v1/bookings/party-bookings/{uuid}/participants
       ↓
Step 3: E-Invitation (skip/view)
       ↓
Step 4: PaymentStep (SumUp)
       ↓
Step 5: Confirmation + PDF Download
  email_service.py → sends customer HTML email + admin alert
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost/spinpin_db

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5000,https://yourdomain.com

# Email (SMTP)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your@email.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=SpinPin Leicester <noreply@spinpin.co.uk>
ADMIN_EMAIL=admin@spinpin.co.uk

# SumUp Payment Gateway
SUMUP_API_KEY=your-sumup-api-key
SUMUP_MERCHANT_CODE=your-merchant-code
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:9000/api/v1
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:5000
```

---

## Known Field Mappings

The frontend `formData` maps to backend as follows:

| Frontend Field | Backend Field | Notes |
|---|---|---|
| `participants` | `kids` | Number of guest participants |
| `spectators` | `adults` | Spectating adults (not playing) |
| `childName` | `birthday_child_name` | |
| `childAge` | `birthday_child_age` | |
| `specialRequests` | `special_requests` | NEW: now stored |
| N/A | `dietary_restrictions` | From `dietaryRestrictions` field |
| `partyPackage` | `package_name` | e.g. "STANDARD", "PREMIUM" |

---

## Database Schema: PartyBooking

Key fields (as of migration 0022):
- `uuid` — Public booking identifier (used in URLs)
- `booking_number` — Human-readable ref (SPPARTY-YYYYMMDD-XXXX)
- `name`, `email`, `phone` — Customer contact
- `date`, `time` — Party date/time
- `package_name` — Which package was selected
- `kids` — Number of participants
- `adults` — Spectating adults
- `spectators` — Additional spectators
- `amount` — Total price (GBP, VAT inclusive)
- `paid_amount` — Amount paid so far
- `birthday_child_name`, `birthday_child_age` — Birthday child details
- `special_requests` — ⭐ NEW: Customer special requests
- `dietary_restrictions` — ⭐ NEW: Dietary restrictions
- `participants` — JSON: `{adults: [...], minors: [...]}`
- `waiver_signed` — Whether waiver has been completed
- `status` — PENDING / CONFIRMED / CANCELLED / COMPLETED
- `payment_status` — PENDING / PARTIAL / PAID / REFUNDED / FAILED
