# Go Kids Play — Full Audit Report

**Date:** 18 October 2026
**Branch:** `feature/cms-admin-overhaul` (merged into `main`, latest commit `f392f19`)
**Scope:** public website, booking wizards, opening calendar, payments, emails, admin portal, CMS, search, security
**Replaces:** `PROJECT_AUDIT_REPORT.md` (older report; several of its claims are no longer accurate — see section 9)

---

## 1. Summary

| | |
|---|---|
| **Overall** | The website and admin portal are functionally complete and tested end to end on a production build. |
| **Fixed in this audit** | 7 security holes, 14 functional bugs, 8 smaller issues (section 4). |
| **Blocked on you** | Live payments (SumUp keys), e-mail sending, Google reviews (API key), Azure deployment (section 7). |
| **Do before go-live** | Rotate passwords that are in the public Git history, set production secrets, schedule two background jobs (section 8). |

---

## 2. How it was tested

| Check | Result |
|---|---|
| Backend automated tests (`pytest`) | **96 / 96 pass** |
| Frontend type check (`tsc --noEmit`) | **Clean** |
| Opening-calendar unit tests (`vitest`) — every date of the 2026-27 Coventry council calendar, admin openings / closures, hours text | **10 / 10 pass** |
| Production build (`next build`) | **Builds cleanly** |
| Browser tests (Playwright, real Chrome, production build) | see below |

| Browser test | Checks | Result |
|---|---|---|
| Public site crawl | 32 pages | All load |
| Session booking end to end (to the SumUp screen) | 9 | Pass |
| Party booking end to end (to the SumUp screen) | 7 | Pass |
| Admin portal crawl | 109 pages | All load (home-page editor slow locally — see 9) |
| Admin functions (walk-in, CMS edit, vouchers) | 6 | Pass |
| Customer account & contact form | — | Pass |
| Special events (reserve, request, admin manage) | 14 | Pass |
| Opening Days → booking calendars | 25 | Pass |
| Booking wizards & calendars in depth | 20 | Pass |
| Website Content dashboard | 7 (48 links) | Pass |
| Admin search & activity log | 21 | 20 pass, 1 expected* |
| Phone-size layouts (390 px) | 15 pages | No overflow |

\* The Campaigns search box only appears once a campaign exists; there are none yet.

The real SumUp **Pay** button was never pressed. All test data (bookings, customers, events, messages, vouchers) was removed after testing.

---

## 3. What the site does now

### Public website
- **Opening hours:** Saturday & Sunday 10.30am–6pm; Monday–Friday only during Coventry school and bank holidays (2025–2027 council calendar built in). Hours are edited in one place (*Website Content → Session Booking*) and every page follows — the hours bar, booking information, prices banner, wizard notice and Google (search-engine) data. Website text can use `{hours}`, `{open}`, `{close}`, `{days}`, `{closed_days}`.
- **Session booking wizard:** one 2-hour all-access ticket; live calendar (closed days can't be picked, holiday and special-opening banners); ticket types and prices from the CMS; £2 online fee; vouchers; account or guest details; SumUp payment.
- **Party booking wizard:** same live calendar (parties can be closed separately); only the configured party times that fit before closing; full or nearly-full times greyed out; minimum children from the CMS; deposit or full payment; guest list; e-invitations.
- **Special events:** event pages, reservations paid at the venue, "Request an Event" form.
- **Testimonies:** Google rating, review count, latest Google reviews (once the API key is added), links to read / write reviews on Google.
- **Customer accounts:** register, sign in on several devices, forgot / reset password, My Bookings, pay a party balance online, update the party guest list, cancel (staff are notified).
- **Navigation:** navbar shows the main pages; the footer lists every page, My Account and the Admin Portal.
- **SEO:** sitemap with every page and event, robots.txt, schema.org business and event data, 404 page.

### Booking numbers
Short random numbers that can't be guessed: **GK**123456 (session), **GP**123456 (party), **EV**123456 (event reservation), **ER**123456 (event request). Created by the server, shown on the confirmation screen, e-mails, e-tickets and payments, and searchable however they are typed ("gk 123 456", "#GK123456").

### Admin portal
- **Opening Days** (*Calendar → Opening Days*): month view of every date; open a date with its own hours, close sessions and/or parties with a reason, or go back to normal. The booking calendars change immediately and the server refuses bookings on closed dates.
- **Website Content dashboard:** quick actions for everyday jobs, today's status, every page and content collection with item counts and empty warnings, search.
- **Search everywhere:** header search (**Ctrl+K**) finds bookings by number / name / e-mail / phone / date, customers, events, requests, payments, vouchers, messages, campaigns, users and admin screens; every list page has its own search and keeps it in the address (`?search=`).
- **Activity Logs:** every admin change and sign-in (including failed ones) — who, what, which record, values sent (secrets hidden), time, IP.
- **Payments:** SumUp and "Paid at venue" payments, searchable by booking number, refunds, staff-only.
- **Bookings:** session, party, all-bookings lists; walk-in and manual party bookings; mark paid (records the payment); arrival; resend confirmation e-mail; e-tickets.
- **Settings switches:** pause online session booking, pause party booking, maintenance mode — all enforced.

---

## 4. Problems found and fixed

### 4.1 Security (all fixed)

| # | Problem | Risk | Fix |
|---|---|---|---|
| S1 | An old hidden endpoint (`party-bookings-old`) let **anyone create a party booking at any price, marked as paid**, on any date | Fake / free parties | Staff only; website uses the checked endpoint |
| S2 | Party invitations could be **listed, edited and deleted by anyone** (children's names, party dates) | Privacy, vandalism | Staff only; bookers update theirs with the booking's private reference |
| S3 | `fix_db_schema` (runs database migrations) was **public** | Anyone could trigger migrations | Super-admin only, POST only |
| S4 | Customers could **change their booking's date, time and number of guests** from My Account with no re-pricing or availability check | Free extra tickets, overbooking, closed dates | Changes go through staff; customers can still edit notes / guest list and cancel |
| S5 | Public availability data included the **names of people booking parties** | Privacy (GDPR) | Names only for staff |
| S6 | Payment list, stats, details and refunds were not restricted to staff (details were public) | Customer and payment data exposure | Staff only; admin pages use signed-in server routes |
| S7 | Booking numbers could be set by the customer's browser | Fake / duplicate references | Server-generated, read-only |

### 4.2 Bookings, payments and admin (all fixed)

| # | Problem | Fix |
|---|---|---|
| F1 | Abandoned online checkouts **held their places forever** (day could show full) | Unpaid online bookings released after 30 minutes; a late payment re-confirms them |
| F2 | **Party slot capacity was never checked** — any number of parties per time | 30 guests per slot enforced; wizard greys out times the party doesn't fit |
| F3 | Party start time and minimum children were not checked by the server | Must be a configured party time that ends before closing; CMS minimum enforced |
| F4 | Settings → online booking / party booking / maintenance mode **did nothing** | Enforced on the website and the server |
| F5 | **"Mark paid" on a party didn't record the money** (balance stayed due) | Records the balance as a "Paid at venue" payment |
| F6 | Desk and walk-in payments didn't appear in Payments | Saved as "Paid at venue" payments |
| F7 | The confirmation screen showed a **booking number that didn't exist** in the system | Shows the stored number |
| F8 | **Activity Logs was a placeholder** — nothing was ever recorded | Real audit trail (section 3) |
| F9 | Header search would have **failed in production** (website and API on different domains); messages / campaigns searches always failed or opened missing pages | Signed-in search route; corrected fields and links |
| F10 | Session / party lists only searched the **latest 100** bookings; party list had no booking numbers; **Users search box did nothing** | Server-side search across all bookings; booking numbers added; Users search works |
| F11 | **"Resend e-mail"** called an endpoint that doesn't exist; the party version only pretended | Real resend for sessions and parties, with the reason if it can't send |
| F12 | Deleting a party invitation design always failed | Fixed |
| F13 | The information box under the booking wizard had **no working editor** | Editor added to *Session Booking* |
| F14 | Payment detail page couldn't load or refund (no sign-in sent) | Rebuilt with signed-in routes |

### 4.3 Smaller issues (all fixed)
- Confirmation e-mails showed an internal id instead of the booking number, "£29.9" instead of "£29.90", "session session", a hard-coded contact e-mail and a broken party link.
- Opening hours were typed into page text in several places (now placeholders filled from the settings).
- Party wizard had a hard-coded "closed on Mondays / open from 12pm" note.
- Sitemap was missing the Information, Gallery, Groups, Reviews, attraction and event pages.
- Old duplicate admin screens (Holidays, Availability, Invitation Templates) conflicted with Opening Days — removed, old links redirect.
- Opening Days screen overflowed on phones.
- Payments provider filter had no SumUp option.
- Admin sidebar highlighted two items at once.

---

## 5. Status by area

| Area | Status | Notes |
|---|---|---|
| Public pages & navigation | ✅ Ready | |
| Opening calendar & Opening Days | ✅ Ready | Add each new school year's council dates (section 8) |
| Session booking | ✅ Ready (to payment) | Payment needs SumUp keys |
| Party booking | ✅ Ready (to payment) | Confirm party capacity rule (section 7) |
| Special events | ✅ Ready | Paid at the venue |
| Customer accounts | ✅ Ready | Reset e-mails need e-mail sending |
| Payments | ⏳ Waiting | SumUp keys needed for live checkout; venue payments work |
| E-mails | ⏳ Waiting | Templates checked and correct; sending is switched off until configured |
| Google reviews | ⏳ Waiting | Built and tested; needs the API key |
| Admin portal | ✅ Ready | 109 pages load; search and activity log working |
| CMS | ✅ Ready | Some collections still empty (section 6) |
| Deployment | ⏳ Waiting | Azure details needed (section 8) |

---

## 6. Content still to add (empty in the CMS)

| Collection | Items | Where it shows |
|---|---|---|
| Customer Reviews | 0 | Testimonies page (fills automatically once Google is connected) |
| Instagram Reels | 0 | Home and About pages |
| Values | 0 | About page |
| Group Bookings packages | 0 | Groups page |
| Party Invitation designs | 0 | Party wizard e-invitation step (skipped while empty) |

Also check: the homepage hero video is a file named **"Spindle Knuckle.mp4"** — confirm it is the intended video.

---

## 7. What is needed from you

| Item | Where it goes | Unlocks |
|---|---|---|
| SumUp API key + merchant code | `backend/.env` → `SUMUP_API_KEY`, `SUMUP_MERCHANT_CODE` | Live card payments, refunds |
| E-mail settings (Azure Communication Services or SMTP) | `backend/.env`, then `EMAIL_ENABLED=True` | Confirmations, password reset, reminders |
| Google Places API key ("Places API (New)") | `backend/.env` → `GOOGLE_PLACES_API_KEY` | Google rating and reviews on Testimonies |
| Azure details (app names, domains) | Azure App Service settings | Deployment |
| Decision: party capacity | — | Now **30 guests per time slot** (two small parties can share a time). Change to one party per slot if needed. |

Never paste keys in chat — put them straight into `backend/.env` (not committed to Git).

---

## 8. Risks and recommendations before go-live

1. **Rotate passwords that are in the public Git history.** The GitHub repository is public and older commits contain customer data dumps and an old staff password (`NinjaPark2026!`). Change every admin password, make the repository private, and decide whether to purge the history (rewriting history needs your approval).
2. **Old staff accounts.** `@ninjapark.com` staff accounts were deactivated locally; check and deactivate them on the production database too.
3. **Production secrets.** Set `SECRET_KEY` and `DEBUG=False` in Azure (the code falls back to an insecure key if `SECRET_KEY` is missing). With `DEBUG=False` the HTTPS, HSTS and secure-cookie settings switch on automatically.
4. **Production URLs.** `frontend/.env.production` still points at the old `spinpin-*` Azure hostnames — update `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_FRONTEND_URL`; set `FRONTEND_URL` on the backend.
5. **Scheduled jobs** (Azure WebJob / cron):
   - `python manage.py release_unpaid_bookings` — every 10–15 minutes (also runs automatically before every booking)
   - `python manage.py sync_google_reviews` — daily (also refreshes when the page is viewed)
   - `python manage.py reverify_pending_payments` — hourly safety net for SumUp payments
6. **Database.** Production uses SQLite on Azure storage. Fine for low traffic; move to Azure Database for PostgreSQL before busy periods to avoid locking during simultaneous bookings.
7. **School calendar upkeep.** Add each new school year's Coventry dates to both `backend/apps/bookings/uk_calendar.py` and `frontend/lib/api/types.ts` (a test fails if they differ). One-off changes are made in *Opening Days*.
8. **Builds on this PC.** Use `NEXT_BUILD_CPUS=2` — more workers run out of memory.

---

## 9. Known limitations and notes

- Google only provides the **5 most relevant reviews per sync**; each sync adds new ones, so the collection grows over time. Staff can hide any review.
- The local development server streams videos slowly, so the homepage editor takes long to finish loading locally; production serves media from Azure storage.
- One older frontend unit test (`media-utils.test.ts`, data-URL handling) fails; it predates this work and does not affect the site.
- `PROJECT_AUDIT_REPORT.md` (older) states that e-mail is integrated, that SumUp splits payments between two merchant accounts (bowling / skating) and that waivers exist — none of this is current. Go Kids Play uses one SumUp merchant, e-mail sending is not configured yet, and waivers were removed.

---

## 10. How to re-check

```bash
# Backend tests
cd gokidsplay/backend && python -m pytest apps -q --no-cov

# Frontend type check and calendar tests
cd gokidsplay/frontend && npx tsc --noEmit && npx vitest run lib/__tests__/coventry-calendar.test.ts

# Production build (low memory)
NEXT_BUILD_CPUS=2 npx next build
```

Admin login for testing: `admin@gokidsplay.co.uk` (password held by the owner).

---

## 11. Changes made during this audit (commits)

| Commit | Change |
|---|---|
| `0fbb654` | Opening calendar + admin Opening Days, weekend hours, short booking numbers |
| `33703f7` | Security fixes, unpaid-booking release, party capacity, settings switches, venue payments, Google reviews, navbar / footer |
| `a8ea8be` | Party wizard offers only times the party fits; server checks party times |
| `243ef2e` | Website Content dashboard with quick actions; resend e-mail, invitation delete, booking-information editor |
| `f392f19` | Admin search everywhere, real activity log, old screens removed |
