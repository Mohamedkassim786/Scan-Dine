# 🍽️ Scan & Dine — Smart Luxury Dining System

A modern, full-stack, real-time QR-based restaurant dining and hospitality platform. Designed with dark luxury aesthetics, real-time order synchronization, digital receipts with direct image download and thermal printing, concierge assistance, and a comprehensive 18-module Admin Control Center.

---

## 🌟 Key Highlights & Core Features

### 📱 1. Customer Dining Experience (Zero-Login / Zero-App)
* **Instant QR Dining**: Scan table QR token (`/r/:slug/t/:token`) to instantly open the table session without sign-up or app downloads.
* **Gastronomy Menu**: Explore categorized menus with dietary tags (Veg, Non-Veg, Vegan), spice levels, allergens, chef picks, and custom notes.
* **Persistent Multi-Order Tracking**: Place multiple rounds of orders (Starters, Mains, Desserts). Returning to the menu or cart retains all previous orders in the table session.
* **Instant Digital Payment Modes**:
  * **UPI** (Google Pay, PhonePe, Paytm) with custom UPI IDs and auto-generated transaction references.
  * **Credit / Debit Cards** (Visa, Mastercard, RuPay).
  * **Cash at Counter / Running Table Tab**.
* **Consolidated Master Bill**:
  * When dining with cash or adding multiple rounds of dishes, orders combine into **one single consolidated master bill**.
  * Download bill as a **high-resolution PNG image** directly to device gallery (**Zero PDF requirement**).
* **Table Service Concierge**: 1-click calls for *"Call Server to Table"*, *"Request Water / Ice"*, *"Extra Cutlery"*, or *"Request Final Bill"*.
* **Dine AI Gastronomy Concierge**: Interactive AI assistant for wine pairings, flavor notes, and tasting menu recommendations.

---

### 👨‍🍳 2. Kitchen Display System (KDS)
* **Real-time Kanban Ticket Flow**: Live columns (`New Orders` → `Accepted` → `In Preparation` → `Ready on Pass` → `Served to Table`).
* **Web Audio API Synth Chimes**: Automatic, crystal-clear 3-note culinary chime on new tickets and 2-tone concierge bell on table assistance calls (no external audio dependencies).
* **Active Table Assistance Calls Strip**: Top-level alert bar for active server calls with 1-click dismissal.
* **Live Timers & Allergen Flags**: Visual badges for allergies, special kitchen instructions, and elapsed cooking timers.

---

### 👑 3. Admin Control Center (18 Comprehensive Modules)
1. **Dashboard & Executive Analytics**: Real-time revenue, order volume, live occupancy, AOV, popular dishes, and hourly peak heatmaps.
2. **Live Floor & Table Map**: Real-time table states (`Available`, `Occupied`, `Billing`, `Cleaning`), capacity badges, and instant table release.
3. **QR Code Studio & Printing**: Generate, download, and print luxury table QR cards with cryptographic tokens.
4. **Interactive Menu Engineering**: Categories, dishes, images, price updates, calorie counters, and 1-click `86 / Availability` toggles.
5. **Real-time Orders Management**: Live ticket stream, status controls, and ticket reprint.
6. **Billing, Payments & Consolidated Settle**: View all payments, filter by UPI/Card/Cash, 1-click table bill settlement.
7. **Chef & Kitchen Staff Accounts**: Manage chef credentials, shift statuses, and password resets.
8. **Customer Feedback & Ratings**: Star ratings, diner reviews, and service sentiment.
9. **Promotions, Coupons & Discounts**: Percentage/flat discount codes, expiry dates, and min-spend constraints.
10. **Inventory & Stock Management**: Real-time stock levels, low-stock threshold alerts, and supplier tracking.
11. **Comprehensive Audit Logs**: Complete trail of menu changes, price updates, user logins, and table operations.
12. **Print System**: Native browser print supporting **80mm Thermal**, **58mm Thermal**, and **A4 Standard** receipts.
13. **Role-Based Access Control**: Strict JWT token authentication and role verification (`admin`, `chef`, `staff`).

---

## 🛠️ Architecture & Tech Stack

```
Scan-Dine/
├── apps/
│   ├── web/                    # React 19 + Vite + TypeScript + Tailwind CSS + Zustand
│   │   ├── src/
│   │   │   ├── components/     # Customer, Admin, Chef & Digital Receipt components
│   │   │   ├── pages/          # 18 Admin pages, Chef KDS, Customer dining pages
│   │   │   ├── services/       # Axios API client & Socket.IO client
│   │   │   ├── store/          # Zustand state stores (Auth & Customer session)
│   │   │   └── utils/          # Web Audio synthesizer chime generator
│   └── api/                    # Node.js + Express + TypeScript + Prisma + Socket.IO
│       ├── src/
│       │   ├── routes/         # Orders, Menu, QR, Tables, Payments, Staff, Analytics
│       │   ├── middleware/     # Role-based JWT & error handlers
│       │   ├── socket/         # Real-time WebSocket event dispatching
│       │   └── utils/          # Audit logging
│       └── prisma/
│           ├── schema.prisma   # Relational database schema (14 models)
│           └── seed.ts         # Production seed data (Aurelian restaurant, 8 tables, 30+ items)
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
* **Node.js** v18 or higher
* **npm** or **yarn**

---

### 2. Backend Setup & Run (Port 3001)

```bash
# Navigate to the API service
cd apps/api

# Install dependencies
npm install

# Push database schema & generate Prisma client
npx prisma db push
npx prisma generate

# Seed sample luxury restaurant (Aurelian, tables, chefs, dishes)
npx tsx prisma/seed.ts

# Start backend dev server
npm run dev
```
> The API server runs at **`http://localhost:3001`** with WebSocket support.

---

### 3. Frontend Setup & Run (Port 5173)

In a new terminal window:

```bash
# Navigate to the Web service
cd apps/web

# Install dependencies
npm install

# Start frontend dev server
npm run dev
```
> Open **`http://localhost:5173`** in your browser.

---

## 🎯 Demo Portals & Login Credentials

### 1. 📱 Customer Table Experience
* **Direct Table Link**: [`http://localhost:5173/r/aurelian/t/tbl-token-5b674914-e934-4d35-aa7e-828ad95ea0a1/menu`](http://localhost:5173/r/aurelian/t/tbl-token-5b674914-e934-4d35-aa7e-828ad95ea0a1/menu)
* **Features**: Zero login, live menu, cart, UPI/Card/Cash checkout, real-time ticket tracker, session orders, and PNG receipt download.

---

### 2. 👨‍🍳 Chef Kitchen Terminal (KDS)
* **URL**: [`http://localhost:5173/chef/login`](http://localhost:5173/chef/login)
* **Email**: `chef.marcus@aurelian.com`
* **Password**: `password123`

---

### 3. 👑 Admin Estate Portal
* **URL**: [`http://localhost:5173/admin/login`](http://localhost:5173/admin/login)
* **Email**: `admin@aurelian.com`
* **Password**: `password123`

---

## 🛡️ Security & Business Logic Guarantees
1. **Zero Customer Friction**: Diners never need to download an application or create accounts.
2. **Cryptographic QR Validation**: Every table has a unique cryptographic token validated on the backend.
3. **Accurate Payment Classification**: UPI, Card, and Cash transactions are recorded with unique reference codes.
4. **Single Master Bill Consolidation**: Multiple rounds of cash/running orders automatically combine into one receipt.
5. **Role-Protected Operations**: Chef and Admin APIs are strictly enforced via JWT authentication.

---

## 📄 License
This project is licensed under the MIT License.
