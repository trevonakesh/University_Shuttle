# Uni Shuttle 🚍

A monthly-fare bus transport platform that connects university students with
private bus operators in Sri Lanka.

Students find an approved bus for their university, request a seat, and pay a
fixed monthly fare by card or cash. Drivers manage passengers, record who has
paid, run daily attendance polls, post notices, and broadcast their live
location. Administrators verify operators, manage accounts, and settle driver
earnings. The billing model follows ride-hailing platforms: the operator
collects the fare, the platform takes a 10% commission, and accounts with
unpaid fares are frozen until settled.

---

## Table of contents

- [System architecture](#system-architecture)
- [Features](#features)
- [Data model](#data-model)
- [Getting started](#getting-started)
- [Demo accounts](#demo-accounts)
- [Optional: PayHere card payments](#optional-payhere-card-payments)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Known limitations](#known-limitations)

---

## System architecture

```
   Flutter app                 Next.js admin console
 (student + driver)                   (web)
        │                               │
        └───────────────┬───────────────┘
                        │
            REST API  +  Socket.IO
                        │
              Node.js / Express (TypeScript)
                        │
                  Prisma ORM
                        │
                  PostgreSQL
                        │
              PayHere (card payments)
```

| Component | Technology |
| --- | --- |
| Mobile app (student + driver) | Flutter (Dart) |
| Admin console | Next.js 16, React 19 |
| Backend API | Node.js, Express 5, TypeScript |
| Database | PostgreSQL 15 (via Docker), Prisma ORM |
| Authentication | JWT with role-based access control |
| Real-time | Socket.IO |
| Maps | flutter_map (OpenStreetMap tiles) |
| Payments | PayHere hosted checkout |

---

## Features

### Authentication and roles
- JWT sessions with three roles: **student**, **driver**, **admin**.
- Drivers register with documents (NIC, licence, vehicle registration, bus
  photo) and must be **approved by an admin** before appearing in student
  search.
- Password reset by six-digit code (hashed and time-limited).

### Student
- Browse buses filtered to their own university; only approved drivers appear.
- Request a seat; one active assignment at a time.
- Pay the monthly fare by card (PayHere) — the amount is fixed by the server
  and cannot be edited by the student.
- Respond to daily attendance polls, read driver notices.
- Track the bus live on a map with distance, ETA, and speed.

### Driver
- **Monthly fare tracker**: every assigned student for a chosen month, split
  into *Paid* / *Unpaid* / *Didn't come* lists with live counts and totals.
- Mark a student as **Paid (Cash)** when they pay in person, mark **Didn't
  come**, or undo either.
- Create attendance polls and see who is travelling, with pickup points.
- Post notices to passengers.
- Broadcast **real GPS location**; each bus has its own channel so students
  only see their own bus.
- Wallet showing net earnings, and request a payout from the platform.

### Admin (web console)
- Verify or reject driver registrations, with submitted documents shown.
- Add and remove drivers and students, including photo uploads.
- View all payments, per-driver earnings, and total platform revenue.
- Review driver payout requests and approve or reject them; approval records
  the payout and decrements the driver's wallet.

### Billing rules
- The monthly fare is set by the driver and is **fixed** — the student cannot
  alter the amount.
- The platform takes **10% commission** on every payment. For in-app payments
  the driver's wallet is credited with the net 90%. For cash payments the
  driver already holds the money, so the 10% is deducted from their wallet.
- A student whose current-month fare is unpaid after the **10th** (Asia/Colombo
  time) has their account **frozen**: seat requests and poll votes are blocked
  server-side until they pay. Students who join after the 10th get a grace
  period for that month.
- A student marked **"didn't come"** is frozen for that month only; the freeze
  lifts automatically the following month, or immediately if they pay.

---

## Data model

| Entity | Purpose |
| --- | --- |
| `User` | Login credentials and role |
| `Student` | Student profile, university, pickup point |
| `Driver` | Driver profile, bus, route, fare, wallet balance, approval status |
| `SeatRequest` | Student ↔ driver assignment and its status |
| `MonthlyFare` | Fare ledger: one row per student per month (PAID / UNPAID / EXEMPT) |
| `Payment` | Completed transactions, with the platform commission recorded |
| `Payout` | Money transferred from the platform to a driver |
| `PayoutRequest` | A driver's withdrawal request awaiting admin review |
| `Poll`, `PollResponse` | Daily attendance polls and student answers |
| `Notice` | Driver announcements |
| `Notification` | In-app notifications |

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)
- [Flutter SDK](https://docs.flutter.dev/get-started/install) 3.x

### 1. Start the database

From the project root:

```bash
docker compose up -d
```

### 2. Configure and start the backend

```bash
cd backend
cp .env.example .env      # then edit .env if needed
npm install
npx prisma db push        # create the database schema
npx prisma generate
npm run dev               # http://localhost:3000
```

### 3. Seed demo data

```bash
npx ts-node --transpile-only seedDemo.ts
```

This clears the database and creates the accounts listed below, along with two
months of payment history, notices, and a poll.

### 4. Start the admin console

```bash
cd web-app
npm install
npm run dev
```

Port 3000 is taken by the backend, so Next.js will start on **3001/3002** —
check the terminal output for the exact address.

### 5. Run the mobile app

```bash
cd mobile-app
flutter pub get
flutter run -d chrome           # run in a browser
# or
flutter run                     # run on a connected device or emulator
```

> The app automatically uses `10.0.2.2:3000` on Android emulators (the host
> machine's localhost) and `localhost:3000` elsewhere, so no configuration is
> required.

---

## Demo accounts

Created by `seedDemo.ts`. Every account uses the password **`demo123`**, except
the administrator.

### Administrator
| Email | Password |
| --- | --- |
| `admin@unishuttle.com` | `admin123` |

### Drivers
| Email | Driver | Route | Fare | State |
| --- | --- | --- | --- | --- |
| `sunil@demo.com` | Sunil Perera (NA-4521) | Homagama → NSBM | 5,000 | Approved, 4 passengers, wallet 18,000 |
| `nimal@demo.com` | Nimal Fernando (NB-8834) | Kottawa → NSBM | 4,500 | Approved |
| `kamal@demo.com` | Kamal Silva (NC-1290) | Malabe → SLIIT | 5,500 | **Awaiting admin approval** |

### Students
All study at NSBM and travel on Sunil's bus unless stated otherwise.

| Email | Student | State |
| --- | --- | --- |
| `amaya@demo.com` | Amaya Jayasuriya | Fare paid for the current month |
| `dinuka@demo.com` | Dinuka Rathnayake | Unpaid past the 10th — **account frozen** |
| `tharindu@demo.com` | Tharindu Bandara | Marked "didn't come" — frozen for this month |
| `senaya@demo.com` | Senaya Wickramasinghe | Unpaid but within the grace period |
| `ishara@demo.com` | Ishara Gunawardena | Not yet assigned to a bus |

---

## Optional: PayHere card payments

Without PayHere credentials the app still works — payments complete instantly
in development mode. To demonstrate the real card checkout:

1. Create a free sandbox account at <https://sandbox.payhere.lk> and note the
   **Merchant ID** and a **Merchant Secret** (add a *Domain* entry, not an App).
2. Expose the backend to the internet so PayHere can send its confirmation:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
3. Fill in the `PAYHERE_*` values and `PUBLIC_URL` in `backend/.env`, using the
   tunnel address, then restart the backend.
4. Pay in the app and use PayHere's sandbox test card
   `4916 2175 0161 1292`, any future expiry, any CVC.

> The tunnel address changes every time the tunnel restarts, so `PUBLIC_URL`
> must be updated each session. If it is stale, payments stay `PENDING`
> because the confirmation callback never arrives.

---

## Testing

End-to-end scripts under `backend/` run against a running API and verify the
business rules:

```bash
cd backend
npx ts-node --transpile-only testFreeze.ts     # account-freezing rules
npx ts-node --transpile-only testPayhere.ts    # payment signature verification
```

Coverage includes the fare ledger, cash and in-app payments with commission,
admin user management, payouts, account freezing (including timezone
boundaries), photo uploads, and the live-tracking socket relay.

---

## Project structure

```
UniShuttle/
├── backend/                 Express + TypeScript API
│   ├── prisma/schema.prisma Database schema
│   ├── src/
│   │   ├── controllers/     Route handlers (auth, fares, payments, admin, …)
│   │   ├── routes/          Express routers
│   │   ├── middleware/      JWT auth, role guards, account-freeze guard
│   │   ├── services/        Fare rules, PayHere integration
│   │   ├── utils/           Timezone-aware date helpers
│   │   └── socketHandler.ts Real-time location relay
│   └── seedDemo.ts          Demo data
│
├── mobile-app/              Flutter app (students and drivers)
│   └── lib/
│       ├── screens/         auth / student / driver / shared
│       ├── services/        API client
│       └── widgets/         Shared UI components
│
├── web-app/                 Next.js admin console
│   └── src/app/             Drivers, students, payments, earnings pages
│
└── docker-compose.yml       PostgreSQL service
```

---

## Known limitations

Documented honestly for review:

- **Socket connections are not authenticated.** Any client can subscribe to a
  bus's location channel or publish to it. Adding JWT verification to the
  Socket.IO handshake is the next security task.
- **The upload endpoint is unauthenticated** and does not restrict file types;
  uploaded identity documents are publicly reachable by URL.
- The JWT secret falls back to a hard-coded default if the environment
  variable is missing; it should fail to start instead.
- Bus seating capacity is stored but not enforced when a driver approves
  students.
- Monetary values are stored as floating-point numbers; a decimal type would
  be safer for financial data.
- Database migrations are not versioned — the schema is applied with
  `prisma db push`.
- Driver location sharing stops when the mobile app is backgrounded.

---

## License

MIT
