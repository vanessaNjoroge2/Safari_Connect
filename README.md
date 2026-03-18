# SafiriConnect — React Transport Booking Platform

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## How to use

On the login screen, click one of the **demo account buttons** to instantly access each role:
- 👤 **Demo Passenger** → Full booking flow
- 🏢 **Demo SACCO Owner** → Fleet & operations dashboard  
- 🛡️ **Demo Super Admin** → Platform governance

## Tech Stack
- React 18 + Vite
- React Router v6 (role-based routing)
- Context API for auth state
- Pure CSS (no UI library — all custom)

## Project Structure
```
src/
├── context/AuthContext.jsx    ← Role-based auth (user/owner/admin)
├── components/
│   ├── UI.jsx                 ← Shared components (Modal, Badge, SeatMap, Charts...)
│   ├── Topbar.jsx
│   ├── Sidebar.jsx            ← Role-specific nav
│   └── ProtectedLayout.jsx    ← Auth guard + layout
├── pages/
│   ├── Login.jsx
│   ├── user/     (8 pages)    ← Passenger flow
│   ├── owner/    (10 pages)   ← SACCO operations
│   └── admin/    (9 pages)    ← Super admin
├── styles/globals.css
└── App.jsx                    ← All routes
```

## Pages: 28 total
**User (8):** Home, Search Results, Seat Selection, Confirm Booking, Payment (STK), Ticket, My Bookings, Profile  
**Owner (10):** Dashboard, Fleet, Routes, Schedules, Seat Layout & Pricing, Bookings, Payments, Analytics, Customers, Settings  
**Admin (9):** Dashboard, Categories, SACCO Management, Users, Booking Oversight, Payments, Analytics, Support/Disputes, Settings
