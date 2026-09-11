# 🐾 PashuSakhi — Digital Livestock Healthcare & Rural Telemedicine Ecosystem

**PashuSakhi** is a comprehensive, production-grade digital platform engineered for rural animal husbandry, livestock telemedicine, and epidemiological disease surveillance. It connects farmers, veterinarians, and government/cooperative administrators into a unified, responsive ecosystem.

---

## 🌟 Ecosystem Architecture & Portals

The project combines specialized role-based frontend portals with an Express & TypeScript REST API backed by PostgreSQL and Prisma ORM.

| Portal / Module | Description | Entry Point |
| :--- | :--- | :--- |
| **Farmer Mobile-First Portal** | Health logging, AI symptom triage, vet booking, multilingual support, offline-ready emergency guides | [`index.html`](./index.html) / [`Farmer (4).html`](./Farmer%20(4).html) |
| **Veterinarian Workspace** | Telemedicine queue, clinical records, prescription builder, diagnostic reviews | [`Vet_Fixed (2).html`](./Vet_Fixed%20(2).html) |
| **Admin & Epidemiological Dashboard** | Disease outbreak heatmaps, vaccination drives, inventory & vet telemetry | [`PashuSakhi_Admin_Dashboard_Final.html`](./PashuSakhi_Admin_Dashboard_Final.html) |
| **Backend REST API** | 12 relational models, 14 enums, RBAC JWT auth, triage rule-engine, PostgreSQL | [`backend/`](./backend/) |
| **Client API Connector** | Shared JavaScript client for seamless frontend-to-backend REST synchronization | [`pashusakhi_api.js`](./pashusakhi_api.js) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** database (v14+)
- Web browser (Chrome, Edge, Firefox, or Safari)

### 2. Setting Up the Backend
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secret

# Run database migrations & seed demo data
npx prisma db push
npm run prisma:seed

# Start development server
npm run dev
```
The backend API server will run at `http://localhost:5000/api/v1`.

### 3. Launching the Portals
You can serve the static frontend portals with the included local server:
```bash
# In the root directory:
node serve.js
```
Or open any of the HTML files directly in your modern web browser.

---

## 👥 Demo Credentials (from Seed)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Farmer** | `ramesh@example.com` | `Farmer@123` |
| **Veterinarian** | `vet.sharma@example.com` | `Vet@123` |
| **Admin** | `admin@pashusakhi.org` | `Admin@123` |

---

## 🛡️ Security & Privacy
- Sensitive local configurations, database credentials, and `.env` files are strictly excluded via `.gitignore`.
- Full role-based access control (RBAC) enforced on protected endpoints.
- Passwords hashed using bcrypt.

---

## 📄 License
ISC / Open Source — PashuSakhi Project.
