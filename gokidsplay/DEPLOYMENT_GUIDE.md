# Go Kids Play — Go-Live Guide (Azure, Azure Email, SumUp, Google)

Step-by-step for putting the site live on **your** Azure account and connecting
payments, e-mail and Google reviews. Do the parts in order. Each part says what
to click, what to copy and where to paste it.

> **Never paste keys, passwords or connection strings into chat or e-mail.**
> They go only into the Azure portal (App settings), GitHub (Secrets) or your
> local `backend/.env` file (which is never uploaded to GitHub).

---

## What you will create

```
                    www.gokidsplay.co.uk                 api.gokidsplay.co.uk
                           │                                     │
                 ┌─────────▼─────────┐               ┌───────────▼──────────┐
 GitHub (main) ──►  Web App: website ├──── calls ───►  Web App: backend API │
  auto-deploy    │  Node 20 (Next.js) │               │  Python 3.11 (Django)│
                 └───────────────────┘               └──┬────────┬────────┬─┘
                                                        │        │        │
                                            PostgreSQL ◄┘  Blob  ◄┘  Azure ◄┘
                                            (bookings)   (photos,   Email
                                                          videos)  (Communication
                                                                    Services)
```

| # | Azure resource | Suggested name | Size to start with | Rough monthly cost* |
|---|---|---|---|---|
| 1 | Resource group | `gokidsplay-rg` | — | free |
| 2 | App Service plan (Linux) | `gokidsplay-plan` | **B1** (B2 if busy) | ~£10–£25 |
| 3 | Web App — backend | `gokidsplay-api` | on the plan above | included |
| 4 | Web App — website | `gokidsplay-web` | on the plan above | included |
| 5 | PostgreSQL flexible server | `gokidsplay-db` | Burstable **B1ms**, 32 GB | ~£12–£20 |
| 6 | Storage account | `gokidsplaymedia` | Standard LRS | ~£1–£3 |
| 7 | Email Communication Service + Communication Service | `gokidsplay-email`, `gokidsplay-acs` | pay per e-mail | pennies |

\*Approximate — check the [Azure pricing calculator](https://azure.microsoft.com/pricing/calculator/) for today's prices. Names must be unique across Azure; if one is taken add a suffix (e.g. `gokidsplay-api-uk`) and use your name everywhere this guide says `gokidsplay-api`.

Pick **UK South** as the region for everything.

---

## Part 1 — Check the code is ready (already done)

Everything is merged into the `main` branch on GitHub. GitHub deploys `main`
automatically once Part 6 is set up:

| Workflow (`.github/workflows/`) | What it does |
|---|---|
| `deploy-backend.yml` | runs the backend tests, then deploys the API |
| `deploy-frontend.yml` | type-checks, builds and deploys the website |
| `scheduled-jobs.yml` | every 15 min: releases unpaid bookings, re-checks SumUp payments · daily: Google reviews/photos, thank-you e-mails |

---

## Part 2 — Create the Azure resources

Sign in at <https://portal.azure.com>.

### 2.1 Resource group
1. Search **Resource groups** → **Create**.
2. Subscription: yours · Name: `gokidsplay-rg` · Region: **UK South** → **Review + create** → **Create**.

### 2.2 App Service plan
1. Search **App Service plans** → **Create**.
2. Resource group `gokidsplay-rg` · Name `gokidsplay-plan` · Operating system **Linux** · Region **UK South**.
3. Pricing plan: **Basic B1** (you can scale up later in one click) → **Create**.

### 2.3 Backend web app (API)
1. Search **App Services** → **Create** → **Web App**.
2. Resource group `gokidsplay-rg` · Name `gokidsplay-api` · Publish **Code** · Runtime **Python 3.11** · OS **Linux** · Region **UK South** · Plan `gokidsplay-plan`.
3. **Review + create** → **Create**.
4. When it's ready open it → **Settings → Configuration → General settings**:
   - **Startup Command:** `bash startup.sh`
   - **SCM Basic Auth Publishing Credentials:** **On** (needed for the GitHub publish profile)
   - **Always on:** On · **HTTPS Only:** On → **Save**.

### 2.4 Website web app
1. **App Services** → **Create** → **Web App** again.
2. Name `gokidsplay-web` · Runtime **Node 20 LTS** · OS **Linux** · Region **UK South** · same plan.
3. After creation → **Configuration → General settings**:
   - **Startup Command:** `node server.js`
   - **SCM Basic Auth Publishing Credentials:** **On** · **Always on:** On · **HTTPS Only:** On → **Save**.

### 2.5 PostgreSQL database
1. Search **Azure Database for PostgreSQL flexible servers** → **Create**.
2. Resource group `gokidsplay-rg` · Server name `gokidsplay-db` · Region **UK South** · PostgreSQL version **16**.
3. **Compute + storage → Configure server**: **Burstable, B1ms**, storage 32 GB → Save.
4. Authentication: **PostgreSQL authentication only** · Admin username e.g. `gkpadmin` · a strong password (save it in a password manager).
5. **Networking** tab: Connectivity **Public access** · tick **"Allow public access from any Azure service within Azure to this server"**.
6. **Review + create** → **Create** (takes ~10 minutes).
7. Open the server → **Databases** → **Add** → name `gokidsplay` → Save.
8. Your connection string (you'll paste it in Part 3):
   ```
   postgresql://gkpadmin:<PASSWORD>@gokidsplay-db.postgres.database.azure.com:5432/gokidsplay?sslmode=require
   ```
   (If the password contains `@ : / ? #` use a password without them, or URL-encode it.)

### 2.6 Storage for photos and videos
1. Search **Storage accounts** → **Create**.
2. Resource group `gokidsplay-rg` · Name `gokidsplaymedia` (lower-case, no dashes) · Region **UK South** · Performance **Standard** · Redundancy **LRS** → **Review + create** → **Create**.
3. Open it → **Data storage → Containers** → **+ Container** → name `media` · access level **Private** → Create. (Files are served through the backend, so the container stays private.)
4. **Security + networking → Access keys** → **Show** → copy **Connection string** (key1) for Part 3.

### 2.7 Azure Email (Communication Services)
E-mails come from your own address, e.g. `bookings@gokidsplay.co.uk`.

**a) Email service and your domain**
1. Search **Email Communication Services** → **Create** → Resource group `gokidsplay-rg` · Name `gokidsplay-email` · Data location **UK** → **Create**.
2. Open it → **Provision domains** → **Add domain** → **Custom domain** → enter `gokidsplay.co.uk`.
3. Azure shows DNS records. Add them where your domain's DNS is managed (the company you bought `gokidsplay.co.uk` from):
   - **TXT** (domain verification) — add, then click **Verify** in Azure.
   - **SPF** (TXT) and **DKIM / DKIM2** (CNAME) — add all, then **Verify** each.
   - If you already have an SPF record, merge Azure's `include:` into the existing one (only one SPF record is allowed).
   DNS can take from minutes to a few hours.
   *(Quick start alternative: **Add domain → Azure managed domain** works instantly but sends from an `@…azurecomm.net` address — fine for testing, not for customers.)*
4. When the domain shows **Verified** → open it → **MailFrom addresses** → add `bookings` (display name **Go Kids Play**).

**b) Communication Service (sends the e-mails)**
1. Search **Communication Services** → **Create** → Resource group `gokidsplay-rg` · Name `gokidsplay-acs` · Data location **UK** → **Create**.
2. Open it → **Email → Domains** → **Connect domain** → choose `gokidsplay-email` and `gokidsplay.co.uk` → Connect.
3. **Settings → Keys** → copy **Connection string** (Primary) for Part 3.

---

## Part 3 — Backend settings

Azure portal → `gokidsplay-api` → **Settings → Environment variables** (or *Configuration → Application settings*) → **+ Add** each row → **Apply** / **Save**.

| Name | Value |
|---|---|
| `SECRET_KEY` | a long random string — generate one with `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DEBUG` | `False` |
| `DATABASE_URL` | the PostgreSQL connection string from 2.5 |
| `AZURE_STORAGE_CONNECTION_STRING` | storage connection string from 2.6 |
| `AZURE_STORAGE_CONTAINER` | `media` |
| `FRONTEND_URL` | `https://www.gokidsplay.co.uk` (until the domain is connected: `https://gokidsplay-web.azurewebsites.net`) |
| `BACKEND_URL` | `https://api.gokidsplay.co.uk` (until then: `https://gokidsplay-api.azurewebsites.net`) |
| `ALLOWED_HOSTS` | `api.gokidsplay.co.uk,gokidsplay-api.azurewebsites.net` |
| `CORS_ALLOWED_ORIGINS` | `https://www.gokidsplay.co.uk,https://gokidsplay.co.uk,https://gokidsplay-web.azurewebsites.net` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` |
| `EMAIL_ENABLED` | `True` |
| `AZURE_COMMUNICATION_CONNECTION_STRING` | connection string from 2.7 b |
| `AZURE_EMAIL_SENDER_ADDRESS` | `bookings@gokidsplay.co.uk` |
| `AZURE_EMAIL_SENDER_NAME` | `Go Kids Play` |
| `CRON_SECRET` | another long random string (also goes into GitHub in Part 6) |
| `PAYMENT_MODE` | `sumup` |
| `SUMUP_API_KEY` | from Part 8 (leave out until you have it) |
| `SUMUP_MERCHANT_CODE` | from Part 8 |
| `GOOGLE_PLACES_API_KEY` | from Part 9 (leave out until you have it) |
| `INTERNAL_PROXY_SECRET` | another long random string — the **same value** goes on the website in Part 4 |

`WEBSITE_HOSTNAME` is set by Azure automatically — don't add it.

The backend refuses to start on Azure without a proper `SECRET_KEY` (so sign-in tokens can't be forged). Django's own `/admin/` screens are switched off on the server (the website's Admin Portal is used instead); add `DJANGO_ADMIN_ENABLED` = `True` only if you ever need them.

## Part 4 — Website settings

`gokidsplay-web` → **Environment variables** → add:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.gokidsplay.co.uk/api/v1` (until then `https://gokidsplay-api.azurewebsites.net/api/v1`) |
| `NEXT_PUBLIC_FRONTEND_URL` | `https://www.gokidsplay.co.uk` (until then `https://gokidsplay-web.azurewebsites.net`) |
| `WEBSITE_NODE_DEFAULT_VERSION` | `~20` |
| `INTERNAL_PROXY_SECRET` | the same value as the backend's `INTERNAL_PROXY_SECRET` |

The `NEXT_PUBLIC_…` values are also built into the website, so set the same values as GitHub **variables** in Part 6.

`INTERNAL_PROXY_SECRET` lets the website pass each customer's own IP address to the API, so the booking, voucher and sign-in limits apply per customer. Without it every customer shares the website's address and busy times could hit the limits. Keep it out of GitHub variables (it is a secret, and only the running website needs it).

---

## Part 5 — Connect GitHub

The code is on GitHub (repository with branches `main` and `feature/cms-admin-overhaul`). Before going live, make the repository **Private**: GitHub → repository → **Settings → General → Danger zone → Change visibility**.

1. Azure → `gokidsplay-api` → **Overview** → **Download publish profile** (a `.PublishSettings` file).
2. Azure → `gokidsplay-web` → **Download publish profile**.
3. Open each file in Notepad and copy **all** of its text for step 6.

## Part 6 — GitHub secrets and variables

GitHub → repository → **Settings → Secrets and variables → Actions**.

**Secrets** tab → **New repository secret**:

| Secret | Value |
|---|---|
| `AZURE_BACKEND_PUBLISH_PROFILE` | whole text of the backend publish profile |
| `AZURE_FRONTEND_PUBLISH_PROFILE` | whole text of the website publish profile |
| `CRON_SECRET` | the same value as the backend's `CRON_SECRET` |

**Variables** tab → **New repository variable**:

| Variable | Value |
|---|---|
| `AZURE_BACKEND_APP_NAME` | `gokidsplay-api` |
| `AZURE_FRONTEND_APP_NAME` | `gokidsplay-web` |
| `BACKEND_URL` | `https://gokidsplay-api.azurewebsites.net` (later `https://api.gokidsplay.co.uk`) |
| `NEXT_PUBLIC_API_URL` | same as Part 4 |
| `NEXT_PUBLIC_FRONTEND_URL` | same as Part 4 |

Then **Actions** tab → **Deploy backend** → **Run workflow** (branch `main`); when it's green, **Deploy frontend** → **Run workflow**. From now on every push to `main` deploys automatically.

---

## Part 7 — First start: data, admin user, photos

### 7.1 Check the backend started
Open `https://gokidsplay-api.azurewebsites.net/api/v1/cms/pricing-plans/` — you should see `[]` (empty list). The startup script created all database tables.

### 7.2 Copy your content (prices, pages, opening hours, events…) from this PC
On this PC, in `gokidsplay/backend`:
```bash
python manage.py dumpdata --natural-foreign --natural-primary \
  --exclude contenttypes --exclude auth.permission --exclude admin.logentry \
  --exclude sessions --exclude core.adminactivity -o site_data.json
```
Upload and load it on Azure: portal → `gokidsplay-api` → **Development Tools → SSH** → **Go**:
```bash
cd /home/site/wwwroot          # Kudu → "Upload" (Advanced Tools → Go → Debug console) can put site_data.json here
python manage.py loaddata site_data.json
```
*(Ask me to do this step with you — I'll check the file first so no test data goes live.)*

### 7.3 Upload photos and videos
Install **Azure Storage Explorer** (free) → sign in → `gokidsplaymedia` → **Blob Containers → media** → **Upload → Upload Folder** → choose `gokidsplay/backend/media`'s contents (keep the folder structure, e.g. `uploads/…`).

### 7.4 Admin login
If you loaded the data in 7.2, your admin accounts came with it. Otherwise, in SSH:
```bash
python manage.py createsuperuser
```
Then change every admin password (the old `NinjaPark2026!` password is in the public Git history) and deactivate any `@ninjapark.com` accounts.

### 7.5 Test on the Azure address
Open `https://gokidsplay-web.azurewebsites.net` — browse, open the booking wizard, sign in to `/admin`.

---

## Part 8 — SumUp (card payments)

**Status: connected and tested (October 2026).** The SumUp account is **Go Kids Go Coventry Ltd**, merchant code **`M99XCC94`**. A test booking opened SumUp's real checkout page with the right amount and booking number (no payment was made).

1. **Make a fresh API key before going live.** The first key was shared in a chat, so replace it: SumUp dashboard → **Developers → API keys** → create a new **secret key** (`sup_sk_…`) → then delete the old one. (The public key is not needed.)
2. Azure → `gokidsplay-api` → Environment variables:
   - `SUMUP_API_KEY` = the new secret key
   - `SUMUP_MERCHANT_CODE` = `M99XCC94`
   - `PAYMENT_MODE` = `sumup`
   → Save (the app restarts).
3. Payment updates arrive automatically: each checkout tells SumUp to notify `BACKEND_URL/api/v1/payments/sumup-webhook/` (nothing to set up in the SumUp dashboard). The website never trusts that message on its own; it always asks SumUp for the real status. The success page and a check every 15 minutes (scheduled jobs) also catch any payment the message missed.
4. Test on the live site: book one ticket, pay with a real card, check **Admin → Payments** shows it as SumUp / Success, then **Refund** it from the payment page.

On this PC the key is in `gokidsplay/backend/.env` (never committed) with `PAYMENT_MODE=sumup`, so a payment made locally is **real**. For practice bookings set `PAYMENT_MODE=mock` (a test checkout page, no money taken) and restart the backend.

---

## Part 9 — Google reviews and photos

The website shows your **Google rating, number of reviews, the latest reviews and up to 10 photos** from your Google Business Profile (Testimonies and Gallery pages), with the credit Google requires. It refreshes twice a day and from **Admin → Website Content → Customer Reviews → Sync now**.

### 9.1 Get the API key (Google Places API)
1. Go to <https://console.cloud.google.com> and sign in with the Google account that should own the key (ideally the business account).
2. Top bar → project picker → **New project** → name `Go Kids Play` → Create, and select it.
3. **Billing** → link a billing account (Google requires one for Places; this site makes only a few dozen calls a day — check the current free monthly usage on Google's pricing page).
4. **APIs & Services → Library** → search **Places API (New)** → **Enable**.
5. **APIs & Services → Credentials** → **Create credentials → API key** → copy it.
6. Click the key → **Edit**:
   - **API restrictions:** Restrict key → tick **Places API (New)** only.
   - Application restrictions: *None* (the key is only used by the backend server and never shown in the browser).
   → Save.
7. Put it in Azure → `gokidsplay-api` → `GOOGLE_PLACES_API_KEY` → Save. (On this PC: `gokidsplay/backend/.env`.)
8. Admin → **Website Content → Customer Reviews** → **Sync now**. The panel shows the rating, number of reviews and photos. If it finds the wrong business, open **Settings** in that panel and paste your **Place ID** (find it with Google's [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)).

### 9.2 About Business Profile manager access
Being added as a **manager** of the Google Business Profile lets you reply to reviews and upload photos on Google (photos you add there will appear on the website after the next sync). The Places API key above is all the website needs.

Google's API returns up to **5 reviews per sync** (its "most relevant"); each sync adds new ones to Customer Reviews, so the collection grows over time, and staff can hide any review. Showing **every** review would need the separate *Google Business Profile API*, which needs an application to Google — we can add it later if you want.

---

## Part 10 — Your domain (www.gokidsplay.co.uk)

Do this when the Azure address works and you are ready to switch over from the old website.

1. Azure → `gokidsplay-web` → **Settings → Custom domains** → **+ Add custom domain** → Domain provider **All other**, TLS **App Service Managed Certificate**, domain `www.gokidsplay.co.uk`. Azure shows a **CNAME** and a **TXT (asuid)** record → add both at your DNS provider → **Validate** → **Add**.
2. Repeat for `gokidsplay.co.uk` (root domain uses an **A** record + TXT, shown by Azure).
3. Azure → `gokidsplay-api` → **Custom domains** → add `api.gokidsplay.co.uk` the same way.
4. Update settings to the real domains: backend `FRONTEND_URL`, `BACKEND_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`; website and GitHub variables `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_FRONTEND_URL`; GitHub `BACKEND_URL`. Then re-run **Deploy frontend** (the website build includes these addresses).
5. Check: booking, sign-in, admin, an e-mail arrives, a test payment and refund.

---

## Part 11 — Go-live checklist

- [ ] Repository is **private**; all admin passwords changed; old `@ninjapark.com` accounts deactivated
- [ ] Backend: `DEBUG=False`, `SECRET_KEY`, `DATABASE_URL` set
- [ ] `INTERNAL_PROXY_SECRET` set to the same value on backend and website
- [ ] Content loaded (7.2) and photos uploaded (7.3); no test bookings / events
- [ ] E-mail: a contact-form message and a booking confirmation arrive
- [ ] SumUp: one real payment and refund work
- [ ] Google: Customer Reviews → Sync now shows the rating
- [ ] **Actions → Scheduled jobs** runs green (every 15 min)
- [ ] Opening Days shows the right open / closed dates; Settings → online booking is on
- [ ] Custom domains with HTTPS on website and API

## If something goes wrong
- **Backend logs:** Azure → `gokidsplay-api` → **Monitoring → Log stream**.
- **Website logs:** `gokidsplay-web` → **Log stream**.
- **Deployment failed:** GitHub → **Actions** → open the red run to see the step that failed.
- **Roll back:** GitHub → Actions → an earlier green **Deploy** run → **Re-run all jobs**.
- **Pause bookings quickly:** Admin → **Settings** → turn off online / party booking, or Maintenance mode.

## What to send me (and what not to)
- ✅ Resource names, the Azure addresses, error messages, screenshots of settings pages **with secret values hidden**.
- ❌ Never send: passwords, `SECRET_KEY`, connection strings, SumUp or Google keys, publish profiles.
