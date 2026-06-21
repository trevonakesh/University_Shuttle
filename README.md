# UniShuttle 🚍

A smart transportation platform designed specifically for university students and private bus operators in Sri Lanka.

LankaTrip connects students with university bus services while providing drivers with tools to manage passengers, attendance, payments, announcements, and live bus tracking.

---

## 📖 Project Overview

Many university students rely on private buses for daily transportation. Managing attendance, payments, route information, and communication between students and drivers is often done manually through phone calls and messaging apps.

LankaTrip provides a centralized solution that simplifies transportation management for both students and drivers.

---

## 🎯 Objectives

- Connect university students with bus services.
- Digitize student registration and bus reservations.
- Enable real-time bus tracking.
- Manage attendance through daily polls.
- Simplify monthly fee collection.
- Improve communication between students and drivers.

---

## 👥 User Roles

### Student

Students can:

- Register and create a profile
- Browse available bus services
- Request seats on buses
- Respond to attendance polls
- Track buses in real time
- Pay monthly transportation fees
- View driver announcements

### Driver

Drivers can:

- Subscribe and register bus services
- Accept or reject student requests
- Manage passenger lists
- Create attendance polls
- Track student payments
- Share live bus locations
- Post announcements

### Admin

Administrators can:

- Verify driver registrations
- Manage subscriptions
- Review complaints
- Manage users
- Monitor platform activities

---

# 📱 Features

## Authentication

- User Login
- User Registration
- Password Recovery
- Role Selection (Student / Driver)
- JWT Authentication

---

## Driver Module

### Driver Registration

Drivers must provide:

- Profile Photo
- Full Name
- Phone Number
- NIC
- Driving License
- Bus Photo
- Bank Account Details
- Route Information
- Monthly Fee Structure

### Student Request Management

- View Student Requests
- Accept Requests
- Reject Requests

### Passenger Management

- View Passenger List
- Add Students
- Remove Students

### Attendance Polls

Drivers can:

- Create Daily Attendance Polls
- View Responses
- Generate Passenger Lists

### Payment Management

- View Paid Students
- View Unpaid Students
- Mark Payments Manually
- Generate Reports

### Live Tracking

- Start Live Location Sharing
- Stop Location Sharing

### Notice Board

- Post Announcements
- Update Schedules
- Share Important Notices

---

## Student Module

### Student Profile

Students provide:

- Name
- Phone Number
- NIC
- University
- Pickup Location
- Destination

### Bus Discovery

Students can:

- Search Available Buses
- View Driver Details
- View Route Information
- View Monthly Fees

### Bus Requests

Students can:

- Request Seats
- View Request Status

### Attendance

Students can:

- Mark Coming
- Mark Not Coming

### Payments

Students can:

- Pay Monthly Fees
- View Payment History
- Download Receipts

### Tracking

Students can:

- View Live Bus Location
- Check Estimated Arrival Time

### Notices

Students can:

- View Driver Announcements

---

# 🏗️ System Architecture

Student App
      |
      |
Flutter Mobile App
      |
      |
REST API / Socket.IO
      |
      |
Node.js + Express Backend
      |
      |
PostgreSQL Database

---

# 🛠️ Technology Stack

| Component | Technology |
|------------|------------|
| Mobile App | Flutter |
| Web Portal | Next.js |
| Backend | Node.js + Express |
| Language | TypeScript |
| Database | PostgreSQL |
| Authentication | JWT |
| Real-time Communication | Socket.IO |
| Maps | Google Maps API |
| Payments | PayHere |
| Hosting | Vercel / Railway |

---

# 📂 Project Structure

lankatrip/
│
├── mobile-app/
│   ├── lib/
│   ├── assets/
│
├── web-app/
│   ├── app/
│   ├── components/
│
├── backend/
│   ├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│
├── database/
│   ├── migrations/
│
└── docs/

---

# 🔐 Security Features

- JWT Authentication
- Password Encryption
- Role-Based Access Control
- Secure Payment Processing
- Driver Verification
- HTTPS Communication

---

# 🚀 Future Enhancements

- QR-Based Bus Check-In
- AI Route Optimization
- Multi-Bus Fleet Management
- Emergency SOS Feature
- In-App Messaging
- Smart Attendance Predictions
- Driver Ratings & Reviews

---

# 📌 Development Roadmap

### Phase 1
- Authentication
- Student Registration
- Driver Registration
- Bus Listings

### Phase 2
- Student Requests
- Passenger Management
- Poll System

### Phase 3
- Payment System
- Notifications
- Driver Notices

### Phase 4
- Live GPS Tracking
- Analytics Dashboard
- Admin Panel

### Phase 5
- Advanced Features
- AI Enhancements
- QR Attendance

---

# 👨💻 Team

Developed as a university transportation management platform to improve student mobility and bus service operations across Sri Lanka.

---

## License

MIT License
