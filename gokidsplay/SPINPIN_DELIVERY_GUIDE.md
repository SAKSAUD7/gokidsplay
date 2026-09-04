# 🚀 SpinPin Leicester - Complete Delivery & Hosting Guide

This document serves as the **Ultimate Handover and Setup Guide** for the SpinPin platform. It contains everything the hosting team needs to know to deploy, configure, and maintain the platform in a production environment.

---

## 1. Project Overview & Architecture

SpinPin is a modern, high-performance web platform built with a decoupled architecture.

- **Frontend Application**: Built with **Next.js 14 (App Router)**, React, TailwindCSS, and Framer Motion. It handles the customer-facing booking wizards, the CMS-driven marketing pages, and the secure Admin Portal.
- **Backend API**: Built with **Django 5.1.4**, Django REST Framework (DRF), and Django Ninja. It manages business logic, database transactions, dual-merchant payment routing, and email communications.
- **Monorepo Structure**: Uses Turborepo (`packages/ui`, `packages/hooks`) to share components and logic across the platform.
- **Database**: SQLite (Development) / MySQL or PostgreSQL (Production).
- **Payment Gateway**: **SumUp API** configured for dual-merchant routing (SpinPin Ltd for Skating/Arcade, Twinkle Town Ltd for Bowling).

---

## 2. GitHub Repository Deliverables

The complete source code is securely stored in your private GitHub repository. 

**What is included in the repository:**
- `frontend/` - The Next.js web application and admin portal.
- `backend/` - The Django API, models, and business logic.
- `packages/` - Shared UI components and configurations.
- `spinpin_db_fixture.json` - **CRITICAL:** This file contains the complete snapshot of the database, including all CMS content, pricing tables, admin accounts, and package configurations created during development.

**What is explicitly excluded (for security/performance):**
- `.env` and `.env.local` files containing secrets.
- `node_modules/` and Python `.venv/` directories.
- The local development database file (`db.sqlite3`).

---

## 3. Server Deployment Procedure (VPS / Ubuntu)

To host the platform on a VPS (e.g., Hostinger, DigitalOcean, AWS), follow this exact order of operations:

### Step 1: Clone and Prepare
1. SSH into the production server.
2. Clone the private GitHub repository to `/var/www/spinpin` (or your preferred directory).
3. Ensure **Node.js (v20+)** and **Python (3.11+)** are installed on the server.
4. Install MySQL server and create a dedicated database and user for `spinpin_prod`.

### Step 2: Backend Setup (Django API)
1. Navigate to the `backend/` directory.
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install mysqlclient  # Required for production MySQL connection
   ```
4. **Create the Production `.env` File**: Create `backend/.env` using the template provided in Section 4.
5. Run database migrations:
   ```bash
   python manage.py migrate
   ```
6. **Load the Initial Data Fixture**: This populates the CMS and settings.
   ```bash
   python manage.py loaddata ../spinpin_db_fixture.json
   ```
7. Start the backend using **Gunicorn** managed by PM2:
   ```bash
   npm install -g pm2
   pm2 start "gunicorn ninja_backend.wsgi:application --bind 0.0.0.0:9000" --name spinpin-api
   ```

### Step 3: Frontend Setup (Next.js)
1. Navigate to the `frontend/` directory.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. **Create the Production `.env.local` File**: Create `frontend/.env.local` using the template provided in Section 4.
4. Build the Next.js production application:
   ```bash
   npm run build
   ```
5. Start the frontend using PM2:
   ```bash
   pm2 start npm --name spinpin-web -- start
   ```

### Step 4: Nginx Reverse Proxy Setup
Configure Nginx to safely expose the applications to the web and secure them with SSL (Let's Encrypt).

1. Route `yourdomain.com/api` and `yourdomain.com/admin` to the Gunicorn server running on `localhost:9000`.
2. Route all other traffic on `yourdomain.com` to the Next.js server running on `localhost:5000`.

---

## 4. Production Environment Variables (Credentials)

The hosting team must create these files manually on the server. **Never commit these to GitHub.**

### 📄 File: `backend/.env`
```ini
# Core Django Security
SECRET_KEY=[Generate a new strong 50+ character string]
DEBUG=False
ALLOWED_HOSTS=api.spinpin.co.uk, spinpin.co.uk, www.spinpin.co.uk, localhost, 127.0.0.1
CORS_ALLOWED_ORIGINS=https://spinpin.co.uk, https://www.spinpin.co.uk

# Database Configuration (MySQL)
DB_ENGINE=django.db.backends.mysql
DB_NAME=spinpin_prod
DB_USER=spinpin_user
DB_PASSWORD=[Secure Database Password]
DB_HOST=localhost
DB_PORT=3306

# SumUp Dual-Merchant Payment Integration
PAYMENT_MODE=sumup
SUMUP_RETURN_URL=https://spinpin.co.uk/book/success

# Account 1: SpinPin Ltd (Skating/Arcade)
SUMUP_SKATING_API_KEY=sup_sk_fLnsSyO1H7KviBiaeq5NcPDKYULWioiyM
SUMUP_SKATING_MERCHANT_CODE=MC933QM6

# Account 2: Twinkle Town Ltd (Bowling)
SUMUP_BOWLING_API_KEY=sup_sk_rvC5s5NFxx2lNzKd54bJgXFwCDXnSCP8S
SUMUP_BOWLING_MERCHANT_CODE=M7EN4CMZ

# Email Configuration (Set up SMTP or Azure for Booking Confirmations)
EMAIL_ENABLED=True
EMAIL_BOOKING_ENABLED=True
# Add SMTP host, port, user, and password here based on your provider
```

### 📄 File: `frontend/.env.local`
```ini
# Must point to the production Nginx route that proxies the Django backend
NEXT_PUBLIC_API_URL=https://spinpin.co.uk/api/v1
```

---

## 5. Admin Portal Access

Once the database fixture is loaded (`python manage.py loaddata`), the administrator accounts are automatically restored.

- **Admin URL**: `https://spinpin.co.uk/admin`
- **Default Username**: `admin`
- **Default Password**: *(Use the password configured during local development. If forgotten, you can create a new superuser via SSH: `python manage.py createsuperuser`)*

From the Admin Portal, staff can:
- View all online transactions and their SumUp payment status.
- Manage CMS content (Pricing, Guidelines, Hero Banners).
- Process "Free Entries" and manage party bookings.
- Review digitally signed liability waivers.

---

## 6. How the Dual-Merchant Payment System Works

The hosting team should understand that SpinPin utilizes a complex payment routing system. 

1. When a customer adds **Roller Skating** to their cart, the Django backend dynamically generates a checkout token using the `SUMUP_SKATING_API_KEY` (SpinPin Ltd).
2. If the cart contains **Ten Pin Bowling**, the backend generates a token using the `SUMUP_BOWLING_API_KEY` (Twinkle Town Ltd).
3. The Next.js frontend securely renders the SumUp payment widget using this token.
4. Once paid, the backend verifies the transaction with SumUp before confirming the booking in the database.

*End of Document. Project is ready for production hosting.*
