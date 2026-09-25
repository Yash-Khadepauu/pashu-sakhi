# 🐄 PashuSakhi

### Smart Livestock Healthcare, Veterinary Telemedicine & Disease Early-Warning Platform

> **Smart India Hackathon (SIH) Prototype**
> **Problem Statement:** 26128 — *Efficient systems for early detection, prevention, and management of livestock diseases and animal health issues*
> **Organization:** Government of Maharashtra

---

## 📌 Overview

**PashuSakhi** is a high-fidelity SIH prototype for a digital livestock-health ecosystem connecting:
* 👨‍🌾 **Farmers**
* 👨‍⚕️ **Veterinarians**
* 🏛️ **Government / System Administrators**

The platform is designed around a simple idea: **One sick animal can be an early signal of a much larger problem.**

This repository contains a fully functional prototype designed to demonstrate the core workflows of this ecosystem, ranging from farmer-level symptom reporting to state-level disease surveillance.

---

## 🎯 Solution & Workflow

The current application implements the following data flow:

```
Farmer
  ↓ (Adds Animal / Reports Symptoms)
Screening & Triage (AI-Assisted)
  ↓ (Generates Severity Score & Recommendations)
Veterinary Escalation
  ↓ (Vet Accepts Case & Prescribes Treatment)
Disease Intelligence
  ↓ (Admin Dashboard Heatmap)
```

### Key Features (Implemented)

#### Farmer
* **Dashboard:** Manage herd and individual animal profiles.
* **Health Screening:** Submit symptoms for AI-assisted triage and severity scoring.
* **Veterinary Consultation:** Initiate chat or emergency 1962 workflows.
* **Multilingual UI:** Switch between English, Hindi, Marathi, and Tamil (prototype translations).

#### Veterinarian
* **Case Management:** Accept new cases, view triage reports, and manage ongoing treatments.
* **Consultation:** Chat with farmers and prescribe actions.
* **Emergency Triage:** Accept urgent 1962 escalations.

#### Admin / Government
* **Epidemiological Dashboard:** View real-time disease heatmaps based on reported symptoms.
* **Analytics:** View mock analytics for consultations and disease outbreaks.

---

## 🏗️ Architecture & Technology Stack

PashuSakhi uses a **dual-mode architecture**. The frontend can connect to the live backend REST API, but is also designed with a robust `localStorage` fallback to ensure the demonstration remains functional even if the backend is unavailable or offline during the hackathon.

**Frontend:**
* HTML5, CSS3, JavaScript (Vanilla)
* React 18 (compiled in-browser via Babel for zero-build-step deployment)
* Chart.js & Leaflet.js

**Backend:**
* Node.js & Express.js (TypeScript)
* Prisma ORM
* PostgreSQL (Embedded via `embedded-postgres`)
* Google Gemini API (for diagnostic intelligence)

---

## 📂 Project Structure

```text
pashu-sakhi/
├── frontend/                  # Web Application
│   ├── index.html             # Login/Signup Gateway
│   ├── farmer.html            # Farmer Dashboard
│   ├── vet.html               # Veterinarian Dashboard
│   ├── admin.html             # Admin Dashboard
│   ├── fieldworker.html       # Field Worker Dashboard
│   ├── pashusakhi_api.js      # API Client
│   ├── serve.js               # Minimal static file server
│   ├── assets/                # Images and logos
│   └── offline-demo/          # Fully offline-capable demo version
├── backend/                   # REST API & Database
│   ├── src/                   # Express Controllers, Routes, Services
│   ├── prisma/                # Database Schema and Seeding
│   ├── .env.example           # Environment template
│   └── package.json
├── docs/                      # Technical Documentation
│   ├── backend_architecture_specification.md
│   ├── implementation_plan.md
│   └── PASHUSAKHI_AUDIT.md
├── start_pashu_sakhi.bat      # Windows Startup Launcher
└── README.md
```

---

## 🚀 Installation & Running the Project

### Prerequisites
* **Node.js** (v18 or higher)
* Git

### Option 1: One-Click Windows Launcher (Recommended)
Simply double-click the `start_pashu_sakhi.bat` file in the root directory. 
This will automatically install dependencies, initialize the database, seed mock data, and start both the backend and frontend servers in separate windows.

### Option 2: Manual Startup

**1. Start the Backend & Database:**
```bash
cd backend
npm install
npm run db:start
# (Wait 5-10 seconds for the database to initialize)
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```
*The backend API will run on `http://localhost:5000`.*

**2. Start the Frontend:**
Open a new terminal window:
```bash
cd frontend
node serve.js
```
*The frontend will run on `http://localhost:3000`.*

---

## 🔑 Demo Access

Navigate to `http://localhost:3000` and use the following pre-seeded demo accounts:

| Role | Email | Password |
|---|---|---|
| **Farmer** | `farmer@pashusakhi.in` | `farmer123` |
| **Veterinarian** | `vet@pashusakhi.in` | `vet12345` |
| **Admin** | `admin@pashusakhi.in` | `admin123` |

---

## ⚙️ Configuration (Optional)

The system works out-of-the-box using simulated data and local fallbacks. To enable live AI intelligence, configure the backend `.env` file:

1. Copy `backend/.env.example` to `backend/.env`
2. Add your Google Gemini API key:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

---

## ⚠️ Current Limitations (Hackathon Context)

As an SIH prototype, the application has certain intentional limitations:
* **Medical Diagnoses:** The symptom triage and AI responses are for **decision support and screening only**. They do not constitute actual veterinary medical diagnoses.
* **Authentication:** Login validation is relaxed to facilitate rapid switching between roles during demonstrations.
* **1962 Integration:** The emergency "1962" dispatch workflow is a simulated capability demonstrating how the UI would interact with state infrastructure.
* **Image Uploads:** AI disease photo analysis is currently a simulated frontend delay returning a placeholder result, as real visual pathology models require extensive specialized training.

---
*Developed for Smart India Hackathon 2026*
