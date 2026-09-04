# PARTY BOOKING FLOW — SpinPin Platform
## Complete End-to-End Documentation

---

## Overview

The party booking is a 5-step wizard at `/party-booking`. Each step collects specific data and persists it to the backend immediately. No data is lost if the user leaves mid-flow.

---

## Step-by-Step Flow

### Step 1: Party Details (Basic Info)

**Page:** `/party-booking` — `PartyBookingWizard.tsx`

**What's collected:**
- Contact: Name, Email, Phone
- Birthday Child: Name, Age
- Party: Date (via SmartCalendar), Time (from available_time_slots in DB), Participants, Spectators
- Special Requests (free text)

**Validation:**
- Date checked against `BookingBlock` via `isDateBlocked()` on client
- Minimum 10 participants enforced (from `MIN_PARTICIPANTS` constant)
- Date cannot be blocked (double-checked on submit)

**On Submit:**
- Calls `createPartyBooking.ts` (Next.js Server Action)
- Sends `POST /api/v1/bookings/party-bookings/` with full payload:
  ```json
  {
    "name": "...", "email": "...", "phone": "...",
    "date": "YYYY-MM-DD", "time": "HH:MM:SS",
    "kids": 12, "adults": 4, "spectators": 4,
    "package_name": "STANDARD",
    "birthday_child_name": "Ella", "birthday_child_age": 8,
    "special_requests": "Nut allergy please",
    "dietary_restrictions": null,
    "amount": 180.00
  }
  ```
- Backend auto-creates/links `Customer` record by email
- Returns `uuid` and `booking_number` → stored in wizard state

---

### Step 2: Participants (Waiver Collection)

**Component:** `ParticipantCollection.tsx`

**What's collected:**
- Name, Email, Phone, DOB for each adult participant
- Name, DOB, Guardian for each minor participant
- Waiver agreement checkbox

**On Submit:**
```
POST /api/party-bookings/{uuid}/participants
{
  "participants": { "adults": [...], "minors": [...] },
  "waiver_signed": true
}
```

---

### Step 3: E-Invitation

**Component:** `EInvitationStep` (inline in wizard)

Currently informational — tells customer they can send e-invitations from their dashboard after booking. Can skip to proceed to payment.

---

### Step 4: Payment (SumUp)

**Component:** `PaymentStep.tsx`

- Receives `bookingId` (integer), `bookingType: "party"`, `amount` (total GBP)
- Initiates SumUp checkout via `/api/v1/payments/sumup/initiate/`
- On success: calls `onSuccess()` → wizard sets `submitted=true`, moves to Step 5

---

### Step 5: Confirmation

**Wizard renders:** Booking summary with:
- Booking ID / Reference
- Total amount, deposit required
- Date / Time / Participants
- **PDF Download button** → `PartyBookingPDF.tsx` (jsPDF, client-side generation)

Email is triggered from backend after payment verification:
- `email_service.py → send_party_confirmation(booking)` sends:
  - HTML branded email to customer
  - Plain text admin alert to `ADMIN_EMAIL`

---

## Data Persistence Architecture

```
Frontend wizard state (React useState)
           │
           │ Step 1 onSubmit
           ▼
POST /api/v1/bookings/party-bookings/
  → PartyBookingSerializer.create()
  → PartyBooking saved to DB
  → Customer auto-created/linked
  → booking.uuid returned
           │
           │ Step 2 onSubmit
           ▼
POST /api/party-bookings/{uuid}/participants
  → PartyBooking.participants JSON updated
  → PartyBooking.waiver_signed = True
           │
           │ Step 4 Payment success
           ▼
POST /api/v1/payments/sumup/initiate/
  → Payment recorded
  → booking.payment_status updated
  → email_service.send_party_confirmation(booking)
           │
           ▼
Step 5 Confirmation shown
  → PDF download available (client-side jsPDF)
```

---

## Key Files

| File | Purpose |
|------|---------|
| `frontend/app/(main)/party-booking/PartyBookingWizard.tsx` | Main 5-step wizard |
| `frontend/app/actions/createPartyBooking.ts` | Server action → POST to Django |
| `frontend/components/PartyBookingPDF.tsx` | Client-side PDF generation |
| `frontend/components/PaymentStep.tsx` | SumUp payment integration |
| `backend/apps/bookings/models.py` → `PartyBooking` | Database model |
| `backend/apps/bookings/serializers.py` → `PartyBookingSerializer` | API serializer |
| `backend/apps/bookings/views.py` → `PartyBookingViewSet` | REST endpoints |
| `backend/services/email_service.py` | Email sending service |

---

## Admin Portal: Party Bookings

**Django Admin:** `http://localhost:9000/django-admin/bookings/partybooking/`
- Shows: booking_number, name, email, phone, date, time, package_name, kids, amount, status, waiver_signed
- Searchable by: booking_number, name, email, phone, package_name
- Filterable by: status, payment_status, waiver_signed, date, package_name

**Custom Admin Portal:** `http://localhost:5000/admin/party-bookings/`
- Full booking management with payment tracking

---

## Pricing Logic

All prices are in **GBP, VAT inclusive**. Configured in `PartyBookingConfig` CMS model.

| Config Key | Default | Description |
|---|---|---|
| `participant_price` | £15.00 | Per participating guest |
| `spectator_price` | £2.95 | Per extra spectator (after 2 free) |
| `free_spectators` | 2 | First N spectators free |
| `deposit_percentage` | 50% | Deposit required to confirm |
| `available_time_slots` | 12:00, 2:00, 4:00, 6:00 PM | Bookable time options |

**Important:** Django REST Framework returns `DecimalField` values as strings (e.g. `"15.00"`). Always coerce with `Number()` before arithmetic in JavaScript/TypeScript.

---

## Common Issues & Solutions

| Issue | Root Cause | Fix Applied |
|---|---|---|
| `toFixed is not a function` | DRF returns Decimal as string | Wrap all `config.*` prices with `Number()` |
| `aria-hidden` hydration warning | Lucide icons SSR/CSR mismatch | Nav buttons only render client-side via `mounted` guard |
| CORS error | `localhost:5000` not in `CORS_ALLOWED_ORIGINS` | Added to `settings.py` |
| `special_requests` not saved | Field missing from PartyBooking model | Added in migration 0022 |
| Admin shows ₹ (rupees) | Wrong currency symbol | Fixed to £ in `admin.py` |
