# 🍽️ Scan & Dine — Smart Luxury Dining & ESP32 Hardware System

A modern, full-stack, real-time QR-based restaurant dining and hospitality platform. Features **ESP32 Smart Table Display microcontrollers**, **Cashier Pass cash payments**, **instant UPI online checkout**, **real-time WebSocket kitchen KDS**, **PNG digital receipts**, and an **18-module Admin Control Center**.

---

## 🌟 Key Highlights & Core Features

### 📡 1. ESP32 Smart Non-Touch Table Display System
* **IoT Hardware Display Endpoint**: `GET /api/esp32/table-status/:tableId` designed for ESP32 microcontrollers over Wi-Fi.
* **3 Screen Display States**:
  * 🟢 **Table Available**: Displays dynamic QR Code + *"Scan to Order"*.
  * 🟡 **Session Active (Dining)**: **Hides QR Code** for security & privacy while guests are dining + shows *"Table 5 · Dining in Progress"*.
  * 🔴 **Cashier Pass / Session Ended**: Automatically displays **NEW QR Code** for the next guest.
* **Admin Live Hardware Simulator**: Preview and simulate ESP32 table displays directly inside the Admin QR Code Hub in real-time.

---

### 💳 2. Payment & Cashier Pass Flows
* **UPI Online Checkout**: Instant payment verification via Google Pay / PhonePe / Paytm. Auto-closes session and regenerates table QR code.
* **Cashier Pass Flow**:
  * Selecting *"Pay Cash at Counter"* instantly generates a **Cashier Pass** (e.g. **#A7F3**) with the total bill on the customer's phone screen.
  * **Zero Table Downtime**: The table QR code regenerates immediately so incoming guests can sit down right away, while outgoing guests pay cash at the cashier counter.
  * Live WebSocket updates auto-refresh the customer screen once the cashier marks the bill as paid.
* **Strict Session Isolation**: Prevents old bills from leaking to new guests when scanning the table QR.

---

### 📱 3. Customer Dining Experience (Zero-Login / Zero-App)
* **Instant QR Dining**: Scan table QR token (`/r/:slug/t/:token`) to instantly open the table session without sign-up or app downloads.
* **Gastronomy Menu**: Explore categorized menus with dietary tags (Veg, Non-Veg, Vegan), spice levels, allergens, chef picks, and custom notes.
* **Multi-Round Ordering**: Place multiple order rounds (Starters, Mains, Desserts). Orders combine into **one single consolidated master bill**.
* **High-Res PNG Receipt Download**: Direct gallery PNG download via Blob URLs (**Zero PDF requirement**).
* **Table Service Concierge**: 1-click calls for *"Call Server to Table"*, *"Request Water / Ice"*, *"Extra Cutlery"*, or *"Request Final Bill"*.

---

### 👨‍🍳 4. Kitchen Display System (KDS)
* **Real-time Kanban Ticket Flow**: Live columns (`New Orders` → `Accepted` → `In Preparation` → `Ready on Pass` → `Served to Table`).
* **Web Audio API Synth Chimes**: Automatic, crystal-clear 3-note culinary chime on new tickets and 2-tone concierge bell on table calls.
* **Active Table Assistance Calls Strip**: Top-level alert bar for active server calls with 1-click dismissal.

---

### 👑 5. Admin Control Center (18 Comprehensive Modules)
1. **Live Floor & Table Map**: Real-time table states (`Available`, `Occupied`, `Billing`, `Cleaning`), capacity badges, and instant table release.
2. **Table QR & ESP32 Hub**: Live ESP32 simulator, high-res vector downloads, and token regeneration.
3. **Dashboard & Executive Analytics**: Real-time revenue, order volume, live occupancy, AOV, popular dishes, and hourly peak heatmaps.
4. **Interactive Menu Engineering**: Categories, dishes, images, price updates, calorie counters, and 1-click `86 / Availability` toggles.
5. **Billing, Payments & Cashier Pass Settle**: View all payments, filter by UPI/Card/Cash, 1-click table bill settlement.
6. **Chef & Kitchen Staff Accounts**: Manage chef credentials, shift statuses, and password resets.
7. **Comprehensive Audit Logs**: Complete trail of menu changes, price updates, user logins, and table operations.

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
│       │   ├── routes/         # ESP32, Sessions, Orders, Menu, QR, Tables, Payments, Staff
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
> The API server runs at **`http://localhost:3001`** with WebSocket and ESP32 status support.

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
* **Features**: Zero login, live menu, cart, UPI/Cashier Pass checkout, real-time ticket tracker, session orders, and PNG receipt download.

---

### 2. 📡 ESP32 Hardware Status Endpoint
* **URL**: [`http://localhost:3001/api/esp32/table-status/token/tbl-token-5b674914-e934-4d35-aa7e-828ad95ea0a1`](http://localhost:3001/api/esp32/table-status/token/tbl-token-5b674914-e934-4d35-aa7e-828ad95ea0a1)
* **Returns**: JSON object for ESP32 microcontroller screen rendering (`{ showQR: boolean, status: "available" | "occupied", qrCodeUrl }`).

---

### 3. 👨‍🍳 Chef Kitchen Terminal (KDS)
* **URL**: [`http://localhost:5173/chef/login`](http://localhost:5173/chef/login)
* **Email**: `chef.marcus@aurelian.com`
* **Password**: `password123`

---

### 4. 👑 Admin Estate Portal
* **URL**: [`http://localhost:5173/admin/login`](http://localhost:5173/admin/login)
* **Email**: `admin@aurelian.com`
* **Password**: `password123`

---

## 📄 License
This project is licensed under the MIT License.
