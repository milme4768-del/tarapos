# Taraaang POS — Production-Ready Multi-Outlet Restaurant Billing Web App

A high-performance, mobile-first, lightweight restaurant billing web application designed for lightning-fast order creation with minimum taps, automatic customer deduplication, flexible portion/unit variants, real-time receipt generation, WhatsApp sharing, and multi-branch admin monitoring.

---

## 🌟 Key Features

### 🚀 For Billing Staff (Mobile-First POS)
* **Zero-Clutter Interface**: Staff only sees *New Bill*, *Bills*, *Customers*, and *Profile*. No confusing reports or configurations on the billing screen.
* **Instant Local Search**: Fast memoized search for food items by name, variant, or SKU without unnecessary network requests.
* **Smart Single-Tap Portions**:
  * If a food item has **1 active variant** (e.g., *Masala Tea 100 ml*), tapping it **instantly adds it to the bill** without any popup!
  * If a food item has **multiple variants** (e.g., *Half Plate*, *Full Plate*), an intuitive touch bottom-sheet appears.
* **Flexible Units & Sizes**: Supports `plate`, `piece`, `gram`, `kg`, `ml`, `litre`, `cup`, `glass`, `bottle`, `portion`, `box`, or `custom` units.
* **Customer Auto-Detection**: Enter customer mobile number — if the customer has visited before, their name and history are automatically recognized.
* **Offline Resilience**: Cart is persisted in `localStorage`. If network fluctuates or phone refreshes, active items and customer inputs are never lost.
* **Duplicate Bill Protection**: Client request idempotency token (`clientRequestId`) prevents accidental double-tap duplicate bills.
* **Instant Receipt & WhatsApp Sharing**:
  * Generates clean, crisp thermal receipt PDF (80mm standard).
  * 1-click WhatsApp share with pre-formatted bill details and normalized customer phone.
  * Direct thermal printing support (`window.print()`).

### 🏢 For Outlet Managers & Admins
* **Executive Monitoring Dashboard**: Live *Today's Sales*, *Today's Bills*, *Today's Guests*, *Active Outlets*, and revenue breakdown per branch.
* **Outlet Data Isolation**: Strict server-side RBAC ensures Outlet A staff cannot see or modify Outlet B records.
* **Historical Price Immutability**: All bills store immutable product, portion, and price snapshots. Modifying food prices in admin never alters historical bill records.
* **High-Precision Money Math**: All calculations executed in integer paise (`₹1 = 100 paise`) to eliminate JavaScript floating-point rounding errors.
* **Server-Side Aggregations**: Fast MongoDB reporting pipelines for daily sales trends, payment mode distributions, and top-selling food items.
* **Customizable Settings**: Restaurant branding, tax rate per branch, currency symbol, and customizable WhatsApp message templates with preview.

---

## 🏗️ Architecture & Technology Stack

```
/Taraaang pos
  ├── /backend
  │     ├── /src
  │     │     ├── /config          # MongoDB connection (URI + embedded fallback)
  │     │     ├── /constants       # Roles, payment methods, bill statuses, units
  │     │     ├── /controllers     # Auth, Bill, Product, Customer, Outlet, Report, User
  │     │     ├── /middleware      # JWT auth, RBAC, outlet isolation, error handler, rate limit
  │     │     ├── /models          # User, Outlet, Category, Product, Customer, Bill, Counter, Setting
  │     │     ├── /routes          # Express REST routes
  │     │     ├── /services        # Business logic & utilities
  │     │     ├── /utils           # Money math (paise), Phone normalization, Seed script
  │     │     └── app.js           # Express app setup with Helmet, CORS, Compression
  │     ├── server.js              # Server entry point & auto-initialization
  │     ├── .env                   # Environment variables
  │     └── package.json
  │
  └── /frontend
        ├── /src
        │     ├── /api             # Axios client with JWT interceptor & API services
        │     ├── /components      # Navbar, VariantModal, BillSuccessModal, ReceiptModal
        │     ├── /pages           # Login, Billing, Bills, Customers, Profile
        │     │     └── /admin     # AdminDashboard, Products, Outlets, Staff, Reports, Settings
        │     ├── /store           # Zustand authStore and persistent cartStore
        │     ├── /utils           # PDF receipt generator (jsPDF) & WhatsApp share
        │     ├── App.jsx          # React Router with code-split lazy routes
        │     ├── index.css        # Tailwind CSS styling & thermal print rules
        │     └── main.jsx
        ├── vite.config.js
        └── package.json
```

### Backend Tech
- **Node.js** (v18+) & **Express.js** (v5)
- **MongoDB** & **Mongoose**
- **JWT** (JSON Web Tokens) & **bcryptjs** password hashing
- **Helmet** (Security headers) & **CORS**
- **Compression** & **express-rate-limit**
- **Embedded Persistent MongoDB Fallback** (`mongodb-memory-server`): Runs immediately out-of-the-box even if no local mongod service is installed.

### Frontend Tech
- **React** (v19) & **Vite**
- **Tailwind CSS** (v4)
- **Zustand** (Lightweight global state with local persistence)
- **React Router** (v7)
- **Lucide React** (Modern feather icons)
- **Axios** (Centralized HTTP client)
- **jsPDF** (Lightweight thermal receipt PDF generator)

---

## ⚡ Quick Start & Installation

### 1. Backend Setup
```bash
cd Backend
npm install
npm run seed     # Seeds demo admin, outlets, categories, products, and customer
npm start        # Starts server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd Frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

---

## 🔑 Demo Login Credentials

The login page includes **1-Click Quick Demo Login** buttons:

| Role | Email | Password | Assigned Outlet | Permissions |
|---|---|---|---|---|
| **Super Admin** | `admin@taraaang.com` | `admin123` | All Outlets (HQ) | Full system access, all outlets, products, staff, reports |
| **Manager** | `manager@taraaang.com` | `manager123` | Taraaang Central (OUT1) | Outlet bills, outlet staff performance, bill cancellation |
| **Staff (Outlet A)** | `staff@taraaang.com` | `staff123` | Taraaang Central (OUT1) | Fast billing, outlet bills, customer registration |
| **Staff (Outlet B)** | `staffb@taraaang.com` | `staff123` | Taraaang Express (OUT2) | Fast billing for Outlet B (isolated from Outlet A) |

---

## 📑 API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate and receive JWT token + user snapshot
- `GET  /api/auth/me` — Current user profile, outlet details & settings
- `PUT  /api/auth/profile` — Update staff name, phone, or password

### POS Billing (`/api/bills`)
- `POST /api/bills` — Create bill (atomic bill sequence, strict price recalculation, customer update)
- `GET  /api/bills` — Paginated bills with date ranges, search, and outlet isolation
- `GET  /api/bills/:id` — Full bill snapshot with item snapshots
- `POST /api/bills/:id/cancel` — Void/cancel bill with reason (audit-logged)

### Products & Portions (`/api/products` & `/api/categories`)
- `GET  /api/products?catalog=active` — Fast active food catalog with active variants for POS
- `GET  /api/products` — Admin paginated products with search & category filters
- `POST /api/products` — Create product with flexible variants & units
- `PUT  /api/products/:id` — Update product prices, portions, or metadata
- `DELETE /api/products/:id` — Toggle active/inactive status

### Customers (`/api/customers`)
- `GET  /api/customers` — Paginated customer database sorted by visits/spend
- `GET  /api/customers/lookup?mobile=...` — Instant phone number auto-lookup
- `GET  /api/customers/:id` — Customer detail and complete purchase history

### Outlets & Branches (`/api/outlets`)
- `GET  /api/outlets` — List outlets (filtered by user assignment)
- `POST /api/outlets` — Create new outlet branch
- `PUT  /api/outlets/:id` — Update outlet code, address, phone, tax %
- `PATCH /api/outlets/:id/status` — Toggle outlet active/inactive

### Executive Reports (`/api/reports`)
- `GET /api/reports/dashboard` — Today's sales, bills, unique customers, sales by outlet
- `GET /api/reports/outlet/:id` — Branch breakdown & staff performance
- `GET /api/reports/sales` — Daily trends, payment modes, top-selling items

---

## 🛡️ Production & Security Best Practices
- **Never Trust Client Totals**: Unit prices, line totals, taxes, and grand totals are always recalculated by the backend against database catalog records before saving.
- **Strict Data Isolation**: Server-side middleware guarantees staff cannot view or manipulate data belonging to other branches.
- **Client Request Idempotency**: Each billing session receives a unique `clientRequestId`. Network retries or rapid double-clicks return the original bill without creating duplicate documents.
- **Money Precision**: Currency amounts are handled in integer paise to eliminate floating-point drift.
