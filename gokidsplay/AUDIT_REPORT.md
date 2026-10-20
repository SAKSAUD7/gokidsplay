# Go Kids Play — Final Audit Before Deployment

**Date:** 20 October 2026
**Branch:** `feature/cms-admin-overhaul` = `main`
**Scope:** everything — public website, booking wizards, customer accounts, payments (SumUp), vouchers, events,
opening calendar, e-mails, admin portal, CMS, search, security, phones, web app / Android app, Azure deployment setup.
**Verdict:** ✅ **Ready to deploy to Azure.** No known bugs are open in the code. What's left is setting up Azure and
the keys/settings only you can provide (section 7).

---

## 1. Test results (production build, this PC)

| Check | Result |
|---|---|
| Backend automated tests (`pytest`) | **140 / 140 pass** |
| Django production-security check (`check --deploy`, DEBUG off) | **0 security warnings** |
| Database migrations up to date | ✅ no missing migrations |
| Frontend type check (`tsc`) | ✅ clean |
| Frontend unit tests (opening calendar, media links) | **15 / 15 pass** |
| Production build | ✅ builds |
| **Azure package rehearsal** — the exact package GitHub deploys, started with `node server.js` | ✅ pages, styles, photos, image resizing, APK, app files all load |

| Browser test (real Chrome, production build) | Result |
|---|---|
| Public site crawl (all pages) | All load |
| Session booking end to end | 9 / 9 |
| Party booking end to end | 7 / 7 |
| Test-mode payments: pay, declined card, party deposit | 8 / 8 |
| **Customer account** — register, every booking type listed, pay party balance online, details, profile, password change, sign-in any capitals, forgot password, privacy protection | **19 / 19** |
| Account & contact form | 6 / 6 |
| Vouchers — admin create / generate, session + party discount, per-customer limit, use history | 22 / 22 |
| Admin functions — walk-in, CMS edit, vouchers | all pass |
| Admin portal crawl | all pages load |
| Admin search & activity log | all pass except 1 expected* |
| Opening Days → booking calendars | 24 / 24 |
| Booking wizards & calendars in depth | 20 / 20 |
| Website Content dashboard | 7 / 7 |
| Photos on every page (no SpinPin / old images, none broken) | all clean |
| **Phones** — 23 pages at 390 px and 360 px, session wizard every step, admin screens | no overflow |
| **Web app** (install, offline page, iPhone/Android instructions, pop-up) and **/app** page (APK download) | all pass** |

\* The Campaigns search box only appears once a campaign exists.
\*\* Chrome's only remark is "incognito", which is the test browser itself.

The real SumUp **Pay** button was never pressed (one real SumUp checkout was opened and then cancelled in SumUp).
All test data was deleted afterwards.

---

## 2. Fixed in this final audit

| # | Problem | Fix |
|---|---|---|
| A1 | **Privacy:** anyone could create an account with someone else's e-mail and immediately see — and cancel — that person's bookings made at the desk | If an e-mail already has bookings, signing up e-mails the owner a "set your password" link instead; only they can open them |
| A2 | **Deployment would point at SpinPin's servers:** `frontend/.env.production` still held the old `spinpin-*` Azure addresses | File emptied; the deploy now stops with a clear message if the address settings are missing |
| A3 | **Website would redirect to the wrong domain** (`www.gokidsplay.uk`) and the Azure test address wouldn't open before the domain is connected | Redirects only to the configured site address |
| A4 | Cancelling a special event left every reservation active and told nobody | Reservations are cancelled, each customer is e-mailed (with the reason and a refund note), the admin sees how many and who needs a refund |
| A5 | My Bookings: event reservations missing; "Complete Payment" shown on cancelled bookings; "Total spent" counted unpaid/cancelled bookings; no way to pay a party balance online; only 10 past bookings; bowling emoji | All fixed — events listed with "Pay at the venue", **Pay balance** button, real "Paid" total, show-all, UK dates |
| A6 | The same customer could be split into two by capital letters in the e-mail (bookings "missing") | E-mails matched and stored in lower case everywhere |
| A7 | Every admin page wrote to a debug log file (slow, grows forever, would fail on Azure) | Removed |
| A8 | Admin image previews showed broken (server address added to `data:` previews) | Fixed (unit test passes) |
| A9 | Pages had two "main" regions (screen readers) | One per page |
| A10 | Hard-coded `localhost` sign-in address; an unused old route | Fixed / removed |
| A11 | Deploy logs flooded with 150+ API-documentation hints | Silenced (docs are development-only) |

### Earlier in this release (already on `main`)
- **Security:** private-by-default API; marketing campaigns could be sent by anyone (fixed); payment admin tools and status staff-only; sign-in / sign-up / reset limited to 10 tries a minute; CSRF on cookie sign-in; SumUp webhook can't be faked; uploads checked; visitor-IP based rate limits; refuses to start on Azure without a real `SECRET_KEY`.
- **Vouchers:** complete (rules, per-customer limits, generated batches, use history, given back on cancellation).
- **SumUp:** connected to Go Kids Go Coventry Ltd (merchant `M99XCC94`), tested to the real checkout page.
- **Photos:** all SpinPin / Ninja Park images replaced with 14 real venue photos.
- **Web app + Android app:** installable from the browser on any phone; Android APK on `/app`; offline page.
- **Phones:** every page checked and fixed (hours bar, footer, party price, ticket rows).
- **Removed:** Group Bookings (page, CMS, API, data).

---

## 3. What the site does (summary)

- **Public site:** home, attractions (4 pages), parties, events, pricing, gallery, testimonies (Google reviews), about, contact, facilities, FAQ, guidelines, legal pages, `/app`.
- **Opening calendar:** weekends 10.30am–6pm + Coventry school & bank holidays; Admin → *Opening Days* opens/closes any date (sessions and parties separately).
- **Session wizard:** live calendar, ticket types from the CMS, £2 online fee, vouchers, sign-in, SumUp.
- **Party wizard:** only party times that fit, capacity per slot, minimum children, deposit or full, vouchers, guest list, e-invitations.
- **Events:** reservations paid at the venue; "Request an Event".
- **Customer account:** bookings of every type, e-ticket, pay outstanding/balance, guest list, cancel, profile, password, reset.
- **Admin portal:** dashboard, bookings (session/party/all), walk-ins, Opening Days, events, payments & refunds, vouchers, customers, users & roles, marketing, CMS for every page, search everywhere (Ctrl+K), activity log, settings (pause bookings, maintenance mode).
- **Booking numbers:** GK… session, GP… party, EV… event, ER… event request — searchable however typed.

---

## 4. Status by area

| Area | Status | Notes |
|---|---|---|
| Public pages, navigation, phones | ✅ Ready | |
| Opening calendar | ✅ Ready | Add each new school year's dates (section 8) |
| Session & party booking | ✅ Ready | |
| Vouchers | ✅ Ready | |
| Events | ✅ Ready | |
| Customer accounts | ✅ Ready | |
| Payments (SumUp) | ✅ Ready | New key in Azure before go-live (section 7) |
| E-mails | ⏳ Needs Azure e-mail | Templates done; sending starts once Azure Communication Services is set (guide Part 2.7 / 3) |
| Google reviews & photos | ⏳ Needs API key | Built and tested with sample data |
| Web app / Android app | ✅ Ready | APK opens full-screen once the site is live on www.gokidsplay.co.uk |
| Admin portal & CMS | ✅ Ready | |
| Deployment (GitHub → Azure) | ✅ Ready to set up | Follow `DEPLOYMENT_GUIDE.md` |

---

## 5. Deployment checklist (in order)

Full click-by-click steps are in **`DEPLOYMENT_GUIDE.md`**. In short:

1. **GitHub:** make the repository **private**.
2. **Azure resources (Part 2):** resource group, App Service plan (Linux), `gokidsplay-api` (Python 3.11), `gokidsplay-web` (Node 20), PostgreSQL, Storage account (`media` container), Communication Services (e-mail).
3. **Backend settings (Part 3):** `SECRET_KEY`, `DEBUG=False`, `DATABASE_URL`, `AZURE_STORAGE_CONNECTION_STRING`, `FRONTEND_URL`, `BACKEND_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, e-mail settings, `CRON_SECRET`, `PAYMENT_MODE=sumup`, `SUMUP_API_KEY`, `SUMUP_MERCHANT_CODE=M99XCC94`, `INTERNAL_PROXY_SECRET`, `GOOGLE_PLACES_API_KEY` (when you have it). Startup command `bash startup.sh`.
4. **Website settings (Part 4):** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_FRONTEND_URL`, `INTERNAL_PROXY_SECRET` (same value as backend). Startup command `node server.js`.
5. **GitHub secrets & variables (Part 6):** two publish profiles, app names, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_FRONTEND_URL`, `CRON_SECRET`, `BACKEND_URL`.
6. **Deploy:** GitHub → Actions → run *Deploy backend*, then *Deploy frontend*.
7. **First start (Part 7):** copy the content from this PC, upload media, create/confirm the admin login, test on the Azure address.
8. **Domain (Part 10):** connect `www.gokidsplay.co.uk` and `api.gokidsplay.co.uk`, update the address settings, redeploy the website.
9. **Go-live checks (Part 11 / 12):** a real payment + refund, an e-mail arrives, Google sync, scheduled jobs green, install the Android app (no address bar).

---

## 6. Content still to add

| Item | Where |
|---|---|
| **Laser Arena photos** | The Laser Arena page and card use the arcade photo for now |
| **High-resolution logo** (PNG/SVG) | Only a 206×22 px logo exists; the app icon is a placeholder in your colours |
| Party room photo | Parties page uses an inflatables photo |
| Instagram reels, About "values", invitation designs | Empty in the CMS (sections hide themselves) |

---

## 7. Needed from you

| Item | Goes in |
|---|---|
| **New SumUp secret key** (the first one was shared in chat) | Azure → `gokidsplay-api` → `SUMUP_API_KEY` |
| Google Places API key | `backend/.env` now / Azure later → `GOOGLE_PLACES_API_KEY` |
| Azure account access while we set it up | — |
| **Back up the Android signing key** | `C:\Users\saksa\.gokidsplay-android\keystore` (never in git) |
| Logo file, Laser Arena photos | send / put in a folder |

Never paste keys or passwords in chat — put them straight into Azure or `backend/.env`.

---

## 8. Risks and notes

1. **Old passwords in Git history.** Older commits contain an old staff password and customer data dumps. Make the repository private, change every admin password, and decide whether to purge history (needs your approval).
2. **Old staff accounts** (`@ninjapark.com`): deactivated locally — check they don't exist in production.
3. **School calendar upkeep:** add each new school year's Coventry dates in `backend/apps/bookings/uk_calendar.py` and `frontend/lib/api/types.ts` (a test fails if they differ).
4. **APK installs** show Android's "unknown apps" warning; publishing on Google Play removes it (`android/README.md`).
5. **This PC** is set to `PAYMENT_MODE=sumup` (real payments) except during testing; it was switched back after testing.

---

## 9. How to re-check

```bash
cd gokidsplay/backend && python -m pytest apps -q --no-cov          # 140 tests
cd gokidsplay/frontend && npx tsc --noEmit && npx vitest run lib/__tests__
NEXT_BUILD_CPUS=2 npx next build                                     # production build (low memory)
```
