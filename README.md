# DutyFixIT 2.0

> A full-stack **MERN** (MongoDB · Express · React · Node.js) platform that connects clients with verified home-service professionals. Clients browse, book, and review workers; workers unlock leads by paying a small acceptance fee; admins manage the platform through a rich dashboard.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Authentication & Security](#authentication--security)
6. [API Reference](#api-reference)
7. [Database Models](#database-models)
8. [Razorpay Payment Integration](#razorpay-payment-integration)
9. [Admin Dashboard](#admin-dashboard)
10. [Getting Started](#getting-started)
11. [Environment Variables](#environment-variables)
12. [Scripts Reference](#scripts-reference)
13. [Performance Optimisations](#performance-optimisations)
14. [Known Limitations & Next Steps](#known-limitations--next-steps)

---

## Overview

DutyFixIT 2.0 is a **lead-generation platform** for home services. The business model is:

- **Clients** book any home service (plumbing, electrical, cleaning, etc.) for free.
- **Workers (Professionals)** pay a fixed ₹100 fee via Razorpay to accept a client booking and unlock the client's contact details.
- **Admins** oversee all activity — bookings, worker verification, customer management, and reviews — via a dedicated dashboard.

---

## Features

### Client (Customer) Features
- Register / Login with role-based authentication
- Browse services by category (Plumbing, Electrical, Cleaning, Painting, Carpentry, AC Service, CCTV, Interior Design, Civil, RO Purifier)
- Book a worker with a date, time, location and contact details
- View and cancel own bookings (`My Bookings`)
- Submit ratings and reviews after a job is completed
- Update profile (name, mobile, DOB, gender, address)

### Worker (Professional) Features
- Register with profession, experience, and availability
- View incoming booking requests with full details
- **Pay ₹100 via Razorpay** to accept a booking (lead-unlock model)
- Reject bookings with an optional reason
- Submit a verification request with certificate upload
- View personal dashboard (stats, wallet, job history)

### Admin Features
- Secure admin login
- Dashboard KPIs: total bookings, pending/completed jobs, total workers, verified workers, total customers
- Full booking management table with status filtering and search
- Worker management: approve/reject verification requests, view certificates, delete workers
- Customer management: view all registered clients
- Review management: view all ratings and feedback

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite, Vanilla CSS, React Router v6 |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB Atlas + Mongoose 9 |
| **Auth** | JSON Web Tokens (JWT) + bcrypt, httpOnly cookie refresh tokens |
| **Payments** | Razorpay (INR, ₹100 fixed fee) |
| **Notifications** | Toastify-JS |
| **Dev Tools** | Nodemon, Concurrently |
| **Icons/Fonts** | Font Awesome 6, Google Fonts (Inter) |

---

## Project Structure

```
DutyFixIT/
├── .env                          # Environment variables (never committed)
├── package.json                  # Root scripts (dev, start, build)
│
├── client/                       # React frontend (Vite)
│   ├── index.html                # Razorpay checkout.js loaded here
│   └── src/
│       ├── App.jsx               # React Router — all routes
│       ├── components/
│       │   ├── Navbar.jsx        # Shared header with JWT-aware logout
│       │   └── Footer.jsx        # Shared footer
│       ├── pages/
│       │   ├── LandingPage.jsx   # Public homepage
│       │   ├── Login.jsx         # Login + Register (all roles)
│       │   ├── ClientPage.jsx    # Client home / service browser
│       │   ├── WorkerPage.jsx    # Worker dashboard
│       │   ├── AdminPage.jsx     # Admin dashboard (lazy-loaded tabs)
│       │   ├── BookingPage.jsx   # New booking form
│       │   ├── ProfileBooking.jsx# Book from a worker profile
│       │   ├── MyBookings.jsx    # Client booking history
│       │   ├── Request.jsx       # Worker incoming requests + Razorpay
│       │   ├── UserProfile.jsx   # Client profile management
│       │   └── WorkerVerify.jsx  # Worker verification certificate upload
│       └── utils/
│           └── api.js            # Shared Axios instance (auto token refresh)
│
└── server/                       # Express backend
    ├── server.js                 # Entry point, middleware, route registration
    ├── config/
    │   └── db.js                 # MongoDB connection
    ├── middleware/
    │   └── authMiddleware.js     # protect() + authorize() JWT middleware
    ├── models/
    │   ├── Client.js             # Client schema + bcrypt hooks
    │   ├── Worker.js             # Worker schema + bcrypt hooks
    │   ├── Admin.js              # Admin schema + bcrypt hooks
    │   ├── Booking.js            # Booking schema (with paymentId fields)
    │   ├── RefreshToken.js       # Server-side refresh token store (TTL)
    │   └── VerificationRequest.js# Worker certificate/verification schema
    ├── routes/
    │   ├── auth.js               # /register /login /refresh /logout
    │   ├── bookings.js           # Full booking CRUD (bulk-optimised)
    │   ├── verification.js       # Worker verification requests
    │   ├── profile.js            # Profile get/update/delete
    │   ├── admin.js              # Admin-only stats, workers, customers, reviews
    │   └── payment.js            # Razorpay order create + verify
    └── scripts/
        ├── create_indexes.js     # Creates MongoDB performance indexes
        └── migrate_passwords.js  # One-time bcrypt hash migration
```

---

## Authentication & Security

DutyFixIT uses a dual-token JWT strategy:

### Token Flow

```
POST /api/auth/login
  └─► Access Token  (JWT, 15 min, returned in JSON body)
  └─► Refresh Token (JWT, 7 days, set as httpOnly cookie)
         └─► stored in MongoDB RefreshToken collection with TTL

Every API request:
  Authorization: Bearer <accessToken>

On 401 (access token expired):
  POST /api/auth/refresh  ← reads httpOnly cookie automatically
  └─► issues new access token (silent, no re-login needed)

POST /api/auth/logout
  └─► deletes refresh token from DB + clears cookie
```

### Security measures

| Measure | Implementation |
|---|---|
| **Password hashing** | bcrypt, salt round 10, via Mongoose `pre('save')` hook |
| **Legacy auto-upgrade** | Plain-text passwords are transparently hashed on first login |
| **Access token storage** | In-memory (React state) — never written to localStorage |
| **Refresh token** | `httpOnly: true`, `sameSite: strict`, `secure: true` in production |
| **Role-based access** | `protect` middleware guards all private routes; `authorize('admin')` guards admin routes |
| **CORS** | `credentials: true` with explicit origin allowlist |

### Middleware

```js
// Protect any route (requires valid access token)
router.get('/private', protect, handler);

// Admin-only route
router.get('/admin-only', protect, authorize('admin'), handler);

// Worker + admin route
router.get('/worker-data', protect, authorize('professional', 'admin'), handler);
```

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Access | Body | Description |
|---|---|---|---|---|
| `POST` | `/register` | Public | `name, email, password, role, mobile, [profession, experience]` | Register client, worker, or admin |
| `POST` | `/login` | Public | `email, password, role` | Login — returns `accessToken` + sets refresh cookie |
| `POST` | `/refresh` | Public | _(cookie)_ | Issues new access token using refresh cookie |
| `POST` | `/logout` | Public | _(cookie)_ | Revokes refresh token + clears cookie |

### Bookings — `/api/bookings` _(protected)_

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/all` | All bookings (admin/worker) — bulk-optimised |
| `GET` | `/client/:email` | Bookings for a specific client |
| `GET` | `/worker/:workerId` | Bookings assigned to a worker |
| `POST` | `/` | Create a new booking |
| `PUT` | `/:id` | Update booking status (accept/reject/complete/cancel) |
| `DELETE` | `/:id` | Delete a booking |

### Payment — `/api/payment` _(protected)_

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/create-order` | Create Razorpay order for ₹100 booking acceptance fee |
| `POST` | `/verify` | Verify HMAC signature + mark booking as Accepted |
| `GET` | `/key` | Return Razorpay key ID to frontend |

### Verification — `/api/verification` _(protected)_

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | All verification requests (admin view) |
| `POST` | `/` | Submit a new verification request with certificate |
| `PUT` | `/:id` | Approve or reject a verification request |

### Profile — `/api/profile` _(protected)_

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/:id` | Get user profile by MongoDB ID |
| `PUT` | `/:id` | Update profile fields |
| `DELETE` | `/:id` | Delete user account |

### Admin — `/api/admin` _(protected + admin only)_

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/stats` | KPI counts for dashboard cards |
| `GET` | `/bookings` | All bookings with filters |
| `GET` | `/workers` | All workers with rating aggregation |
| `GET` | `/customers` | All clients |
| `GET` | `/reviews` | All ratings and reviews |
| `DELETE` | `/workers/:id` | Delete a worker account |
| `DELETE` | `/customers/:id` | Delete a client account |

---

## Database Models

### Client
```
name, email, password (hashed), role, mobile, dob, gender, address{flatNumber,city,pincode}
```

### Worker
```
name, email, password (hashed), role, mobile, profession, experience,
profilePic, isVerified, verificationStatus, rating, jobsCompleted, workerId (e.g. DF001)
```

### Booking
```
bookingId, clientName, clientEmail, service, subService, contact,
date, time, location{houseNo,street,city,pincode,type},
workerId, workerName, workerPhone, profession, status,
rejectionReason, cancellationReason, paymentScreenshot,
rating, feedback, paymentId (Razorpay), paymentOrderId
```

### RefreshToken
```
token, userId, userRole, expiresAt (TTL auto-delete)
```

### VerificationRequest
```
workerEmail, workerName, certificate (Base64), status, createdAt
```

---

## Razorpay Payment Integration

Workers pay **₹100** to accept a booking. The flow:

```
1. Worker clicks "Pay ₹100 & Accept" on Request.jsx
2. Frontend → POST /api/payment/create-order { bookingId, amount: 100 }
3. Server creates Razorpay order → returns { orderId, keyId, amount }
4. Razorpay Checkout modal opens in the browser
5. Worker completes payment (UPI / Card / Netbanking)
6. Frontend → POST /api/payment/verify { signatures + bookingId }
7. Server verifies HMAC-SHA256 signature
8. On success → booking.status = 'Accepted', paymentId stored
9. UI updates with green "Paid" badge
```

**Test mode:** Set real Razorpay test keys in `.env` (see below).  
**Production:** Replace test keys with live keys and set `NODE_ENV=production` (enables `secure` cookie flag).

---

## Admin Dashboard

The Admin Dashboard at `/admin` uses **lazy-loaded tabs** — data is fetched only when a tab is first visited, and cached for the session.

| Tab | Data loaded |
|---|---|
| **Dashboard** | Stats KPIs + last 6 bookings |
| **Bookings** | All bookings with status/search filter |
| **Workers** | All workers with verification status + approve/reject actions |
| **Customers** | All registered clients |
| **Reviews** | All ratings and written feedback |

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- A **MongoDB Atlas** cluster (free tier works)
- A **Razorpay** account (test mode keys are free)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/manikandan-704/DUTYFIXIT.git
cd DUTYFIXIT

# 2. Install root + server dependencies
npm install
cd server && npm install && cd ..

# 3. Install client dependencies
cd client && npm install && cd ..

# 4. Create .env in the project root (see Environment Variables below)
```

### First-time Database Setup

```bash
# Create MongoDB performance indexes (run once)
node server/scripts/create_indexes.js

# If you have existing plain-text passwords, migrate them to bcrypt (run once)
node server/scripts/migrate_passwords.js
```

### Running Locally

```bash
# Starts both backend (port 5000) and frontend (port 5173) concurrently
npm run dev
```

Open **http://localhost:5173** in your browser.

### Production Build

```bash
npm run build      # Builds the React app into client/dist/
npm start          # Serves everything from Express on port 5000
```

---

## Environment Variables

Create a `.env` file in the **project root** with:

```env
# Server
PORT=5000

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0

# JWT Secrets — use long, random strings in production
JWT_SECRET=your_access_token_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here

# Razorpay (get from dashboard.razorpay.com → Settings → API Keys)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXX

# Set to 'production' to enable secure cookies in deployment
# NODE_ENV=production
```

> ⚠️ **Never commit `.env` to version control.** It is already listed in `.gitignore`.

---

## Scripts Reference

| Command | Description |
|---|---|
| `npm run dev` | Run backend + frontend concurrently (development) |
| `npm start` | Run backend only (production) |
| `npm run build` | Build React frontend into `client/dist/` |
| `node server/scripts/create_indexes.js` | Create MongoDB performance indexes (run once on new DB) |
| `node server/scripts/migrate_passwords.js` | Hash all plain-text passwords with bcrypt (run once) |

---

## Performance Optimisations

### Backend — N+1 Query Elimination

All major routes were refactored from individual per-document DB calls to **bulk aggregation pipelines** and **hash-map joins**:

| Route | Before | After |
|---|---|---|
| `/api/admin/workers` | 3 × N queries | 3 total (bulk `$in` + aggregation) |
| `/api/admin/customers` | 2 × N queries | 2 total |
| `/api/bookings/all` | 2 × N queries | 3 total |
| `/api/verification` | N queries | 2 total |

- All sorted queries use `.allowDiskUse(true)` to prevent MongoDB's 32 MB in-memory sort limit error.
- MongoDB indexes on `email`, `status`, `workerId`, and `createdAt` fields.

### Frontend — Lazy Loading

The Admin Dashboard defers API calls until the user first visits each tab. Results are cached in React state for the session — no repeated fetches on tab switch.

### Frontend — Shared Axios Instance

All pages share a single `api.js` Axios instance that:
- Automatically attaches the `Authorization: Bearer <token>` header
- Silently refreshes the access token on 401 (queues concurrent requests to avoid race conditions)
- Redirects to `/login` only if the refresh token is also expired

---

## Known Limitations & Next Steps

### Security
- [ ] Replace hardcoded admin credentials (`admin123`/`host123`) with a proper DB admin account
- [ ] Add rate limiting (e.g. `express-rate-limit`) on `/api/auth/login` to prevent brute force
- [ ] Add input validation with `express-validator` or `zod` on all POST/PUT routes

### Features
- [ ] Real-time notifications (Socket.IO) when a new booking is assigned
- [ ] Worker wallet management UI for Razorpay recharges
- [ ] Client-side booking cancellation with refund policy
- [ ] Email notifications (Nodemailer) for booking confirmation and status updates
- [ ] Pagination on admin tables (currently loads all documents)

### DevOps
- [ ] Add CI/CD pipeline (GitHub Actions)
- [ ] Dockerise the application
- [ ] Deploy: Render / Railway (backend) + Vercel / Netlify (frontend) or single VPS

---

## License

ISC © 2024 [Manikandan](https://github.com/manikandan-704)
