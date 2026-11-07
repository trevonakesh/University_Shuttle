# UniShuttle🚍

A transportation platform for university students and private bus operators in Sri Lanka.

Students find a university bus, request a seat (monthly or daily), answer attendance polls, pay fares in-app and track the bus live. Drivers manage passengers, fares, polls and notices, and withdraw their earnings. An admin verifies drivers, monitors payments and settles driver payouts.

---

## 🏗️ Architecture

```
 Flutter mobile app            Next.js web app
 (students & drivers)          (public website + admin panel)
          \                         /
           \   REST (JSON) + JWT   /
            \                     /
        Node.js + Express backend  ── Socket.IO (live tracking, status updates)
                    |
              Prisma ORM
                    |
               PostgreSQL
```

| Component | Folder | Technology |
|---|---|---|
| Backend API | `backend/` | Node.js, Express 5, TypeScript, Prisma 7, Socket.IO, Multer |
| Database | `docker-compose.yml` | PostgreSQL 15 |
| Mobile app | `mobile-app/` | Flutter (Provider, `flutter_map` / OpenStreetMap, `geolocator`, `socket_io_client`) |
| Web app | `web-app/` | Next.js 16, React 19 (public website + admin panel) |
| Auth | — | JWT + bcrypt password hashing, role-based access |
| Payments | — | PayHere (student fares) |

---

## 👥 User Roles

### Student (mobile app)
- Register with university, travel and emergency-contact details, plus a profile photo
- Browse approved buses (route, schedule, monthly and daily fees)
- Request a seat on a **monthly** or **daily** payment plan
- Book single **daily rides** (round trip, to-uni only or from-uni only)
- Answer attendance polls ("Coming" / "Not coming")
- Pay fares in-app and view payment history
- Track the bus live on a map
- Read driver notices and notifications

### Driver (mobile app)
- Register with NIC, licence, vehicle registration, bus photo, bank details, route, schedule and fees
- Wait for admin approval (the pending screen updates live when approved)
- Accept or reject seat requests and daily ride requests
- Manage the passenger list
- Use the monthly **fare tracker**: mark students Paid (cash) or Exempt (not travelling)
- Create attendance polls and view responses
- Share live GPS location
- Post notices
- View wallet balance and request payouts

### Admin (web app, `/admin`)
- Approve or reject driver registrations
- Manage drivers and students
- View all payments and platform commission earnings
- Review driver payout requests and record payouts
- Read messages sent through the website's contact form

---

## ⚙️ How It Works

### Seat requests
A student requests a seat on a driver's bus. The driver approves or rejects it. Once approved, the student is that driver's passenger and is billed monthly.

### Monthly fares and account freezing
- Each passenger has a fare record per month (`MonthlyFare`): `UNPAID`, `PAID` or `EXEMPT`.
- Fares are due by the **10th** of the month (Asia/Colombo time).
- A background job runs every 6 hours. From the **8th** it sends "pay before the 10th" reminders. After the 10th it sends an "account frozen" notice.
- **Frozen** students can't request seats or vote in polls. They can still pay and view data, so they can unfreeze themselves.
- Students approved after the 10th are in a grace period and aren't frozen that month.
- If the driver marks a student `EXEMPT` (not travelling), the account is frozen for that month only. Paying the fare unfreezes it.
- A paid daily ride for today unfreezes the student for that day.

### Payments and driver wallet
- Students pay through **PayHere** checkout. The backend signs the order, and PayHere's server-to-server notify callback confirms it.
- If no PayHere credentials are configured, in-app payments complete instantly (development mode).
- The platform keeps a **10% commission**. The rest is credited to the driver's wallet.
- Drivers submit **payout requests**. When an admin approves one, a `Payout` is recorded and the wallet is debited.

### Daily rides
Students can book a single day instead of a monthly seat. The fare comes from the driver's `dailyFeeRoundTrip` or `dailyFeeOneWay`. The driver approves the request and the student pays for it.

### Live tracking (Socket.IO)
Sockets must send the user's JWT when connecting (`auth: { token }`); connections without one are refused. The server takes the driver or student identity from the token, never from ids the client sends.

| Event | Sent by | Purpose |
|---|---|---|
| `joinDriverRoom` | Driver | Join the room for their own bus |
| `updateLocation` | Approved driver | Broadcast GPS position (lat, lng, speed, heading); at most one per second |
| `stopBroadcast` | Driver | Stop sharing; students receive `busOffline` |
| `joinStudentRoom` | Student | Follow a bus they have an approved seat on, or an approved daily ride with today, while not frozen. Otherwise the server replies `trackingDenied`. Receives the last known position (if under 5 minutes old) immediately |
| `busLocationUpdate` | Server | Pushes position updates to students |
| `joinStatusRoom` | Driver | Receives `driver_status_updated` (approval) and `fareUpdated` (a student paid) |

### Password reset
Users request a 6-digit code, which is valid for 15 minutes and stored hashed. The code is only ever sent by email; the API response never contains it.

### Emails
The backend sends transactional emails over SMTP (`backend/src/services/email/`). They go out in the background, so a mail failure never fails the request.

| When | Who gets it |
|---|---|
| Student signs up / admin creates an account | Welcome / "your account is ready" |
| Any sign-in | "New sign-in" alert with time, device and IP |
| Forgot password / password changed | Reset code / confirmation |
| Driver applies, is approved or rejected | Driver |
| Seat request or daily ride approved/rejected | Student |
| Card payment, daily ride payment, cash recorded, marked not travelling | Student (receipt) |
| Charged twice (card arrives after cash) | Student (refund due) |
| Fare reminder (8th–10th), account frozen (after the 10th) | Student, once per month |
| Payout requested / sent / rejected | Driver, and every admin for new requests |
| Website contact form | Auto-reply to the sender, copy to the business inbox |

If `SMTP_HOST` is not set, nothing is sent. Each email is saved as HTML in `backend/.emails/` (git-ignored) and logged to `outbox.jsonl`, so you can open it in a browser.

---

## 🔌 REST API

All endpoints are prefixed with `/api`. Most require an `Authorization: Bearer <token>` header.

| Prefix | Purpose |
|---|---|
| `/auth` | Register student/driver, login, forgot/reset password, `GET /me` |
| `/buses` | List approved buses, bus details |
| `/requests` | Seat requests (create, list for student/driver, approve/reject, delete) |
| `/daily-rides` | Daily ride requests (create, list, update status, pay) |
| `/fares` | Driver fare tracker, student's own fare/freeze status, set fare status |
| `/payments` | Create/initiate payments, PayHere checkout/notify/return, history, wallet |
| `/payout-requests` | Driver withdrawal requests |
| `/polls` | Create polls, list, vote, delete |
| `/notices` | Driver notices |
| `/notifications` | User notifications, mark as read |
| `/upload` | Image upload (served from `/uploads`) |
| `/contact` | Public website contact form |
| `/admin` | Admin-only: drivers, students, payments, payouts, payout requests, messages |

---

## 📂 Project Structure

```
University_Shuttle/
├── backend/
│   ├── prisma/schema.prisma      # Database models
│   ├── src/
│   │   ├── index.ts              # Express + Socket.IO server entry
│   │   ├── socketHandler.ts      # Live tracking & real-time events
│   │   ├── fareReminders.ts      # Fare reminder / freeze notification job
│   │   ├── controllers/          # Route handlers
│   │   ├── routes/               # Express routers
│   │   ├── middleware/           # JWT auth, role check, freeze guard
│   │   ├── services/             # Fare/freeze logic, PayHere integration, email/
│   │   └── utils/time.ts         # Asia/Colombo date helpers
│   ├── seedAdmin.ts, seedDemo.ts, seedDriver.ts, seedUsers.ts
│   └── uploads/                  # Uploaded images (git-ignored)
├── mobile-app/
│   └── lib/
│       ├── screens/auth/         # Login, role selection, registration, forgot password
│       ├── screens/student/      # Dashboard, buses, my bus, payments, polls, tracking
│       ├── screens/driver/       # Dashboard, passengers, payments, polls, tracking
│       ├── screens/shared/       # Notice board, info screens
│       └── services/api_service.dart
├── web-app/
│   └── src/
│       ├── app/                  # Public website: home, how-it-works, contact
│       ├── app/login/            # Admin login
│       ├── app/admin/            # Drivers, students, payments, earnings, enquiries
│       ├── components/           # Site header/footer, admin shell
│       └── lib/                  # API client, business details (business.ts)
└── docker-compose.yml            # PostgreSQL
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Docker (for PostgreSQL)
- Flutter SDK 3+ and an Android emulator or device

### 1. Database
```bash
docker compose up -d
```
This starts PostgreSQL on `localhost:5432` (db `lankatrip`, user `lankatrip_user`).

### 2. Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql://lankatrip_user:lankatrip_password@localhost:5432/lankatrip
JWT_SECRET=<random, 32+ characters>  # the server won't start without one; generate with:
                                     # node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
PORT=3000
# TRUST_PROXY=1                      # set when running behind a reverse proxy/load balancer

# Optional — PayHere (leave unset for instant dev payments)
# PAYHERE_MERCHANT_ID=
# PAYHERE_MERCHANT_SECRET=
# PAYHERE_MODE=sandbox
# PUBLIC_URL=https://<your-tunnel>     # must be internet-reachable for PayHere notify
# APP_PUBLIC_URL=http://<your-lan-ip>:3000

# Optional — email (leave SMTP_HOST unset to save emails to backend/.emails/ instead)
# SMTP_HOST=smtp.gmail.com            # or your provider: Brevo, SendGrid, Amazon SES, Mailgun...
# SMTP_PORT=587                       # 465 uses TLS automatically
# SMTP_SECURE=false
# SMTP_USER=
# SMTP_PASS=                          # for Gmail, an App Password, not your normal password
# EMAIL_FROM="Uni Shuttle <no-reply@yourdomain.lk>"
# EMAIL_REPLY_TO=support@yourdomain.lk
# BUSINESS_INBOX_EMAIL=hello@yourdomain.lk   # contact-form copies; defaults to every admin
# WEB_APP_URL=https://yourdomain.lk   # used for links inside emails
```

Create the tables, seed an admin and start the server:
```bash
npx prisma db push
npx prisma generate
npx ts-node seedAdmin.ts      # admin@unishuttle.com / admin123 (override with ADMIN_EMAIL / ADMIN_PASSWORD)
npm run dev                   # http://localhost:3000
```
`seedDemo.ts`, `seedDriver.ts` and `seedUsers.ts` add sample data.

### 3. Web app
```bash
cd web-app
npm install
npm run dev                   # Next.js picks the next free port (e.g. 3001) since the API uses 3000
```
The public website is at `/` and the admin panel at `/admin` (admin login required). Contact details in `src/lib/business.ts` are placeholders; replace them before going live. Optional env: `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3000`).

### 4. Mobile app
```bash
cd mobile-app
flutter pub get
flutter run
```
The app calls `http://10.0.2.2:3000/api` on the Android emulator and `http://localhost:3000/api` on web/desktop. Edit `lib/services/api_service.dart` to use a physical device's LAN address.

---

## 🔐 Security

- Passwords and reset codes are hashed with bcrypt
- JWT authentication with role-based authorisation (`STUDENT`, `DRIVER`, `ADMIN`)
- Drivers are verified by an admin before they can operate
- PayHere checkout and notify payloads are MD5-signed and verified server-side
- Freeze guard blocks frozen students from protected actions
- The server refuses to start without a `JWT_SECRET` of at least 32 characters (no fallback)
- Brute-force limits, counted per account and per IP over 15 minutes:
  - Sign-in: 5 wrong passwords lock that account for 15 minutes; 30 failures lock that IP address.
  - Reset codes: 3 requests per email, 10 per IP. A code is destroyed after 5 wrong guesses.
- Socket.IO connections require a JWT; tracking is limited to the student's own bus
- Uploads accept only real images (checked by content), are rate-limited, and are served with `nosniff`
- Errors are logged on the server; clients only ever get a generic message (no stack traces or error text)
- Financial records are never deleted. Removing a driver or student who has payments, payouts or settled fares deactivates the account instead: they can't sign in and leave their bus or passengers, but the records stay. The database enforces this too: money tables use `onDelete: Restrict`. Accounts with no history are deleted outright. A driver can't be removed while their wallet still holds money.
- Payout approvals claim the request and debit the wallet in a single conditional update, so simultaneous approvals pay once and payouts can't overdraw a wallet

The limits are kept in memory, so they reset when the server restarts and apply to each server process separately.

---

## 🛣️ Future Enhancements

- Email/SMS delivery for password reset codes and reminders
- Estimated arrival times on the tracking map
- Downloadable payment receipts and reports
- QR-based bus check-in
- Multi-bus fleet management
- Emergency SOS
- In-app messaging
- Driver ratings and reviews

---

## License

MIT License
