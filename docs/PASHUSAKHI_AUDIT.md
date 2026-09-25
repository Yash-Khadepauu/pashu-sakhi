Here is the complete, rigorous reverse-engineering and technical audit of the current PashuSakhi project. 

==================================================
PART 1 — PROJECT OVERVIEW
==================================================

**1. What this application currently does:**
The application provides a digital livestock healthcare platform connecting farmers with veterinarians. It allows farmers to manage their herd, report symptoms, receive automated triage results, and chat with vets. Vets can review cases and prescribe treatments. Admins can view disease hotspots on a dashboard.

**2. What the main user-facing purpose is:**
To reduce livestock mortality through early disease detection (triage) and remote veterinary telemedicine, specifically targeting rural areas with limited vet access.

**3. Who the current users appear to be:**
Farmers, Veterinarians, and Government/System Administrators.

**4. What the major workflows are:**
- Farmer logs an animal's symptoms → System auto-triages risk → Vet reviews and assigns treatment.
- Farmer reports an emergency → 1962 Helpline triggered → Vet accepts the emergency.
- Admin monitors disease clusters on a heatmap.

**5. What the application appears to be trying to demonstrate:**
A Smart India Hackathon (SIH) prototype demonstrating an end-to-end national livestock health grid, showcasing AI-powered triage, "1962" helpline integration, and real-time epidemiological tracking. 

**6. What is actually functional right now:**
The UI is incredibly rich and fully interactive. The backend supports full CRUD operations via PostgreSQL. However, the "AI" is completely simulated by rule-based logic, the "Map" is a custom-drawn SVG (not a real map), and the "Real-time Chat/Alerts" utilize a clever `localStorage` bridging trick rather than WebSockets.

==================================================
PART 2 — COMPLETE PROJECT STRUCTURE
==================================================

- **Framework:** Express.js (Backend). No build-step frontend (Frontend).
- **Language(s):** TypeScript (Backend), JavaScript/HTML/CSS (Frontend).
- **Frontend Architecture:** Single-file HTML applications using **Babel Standalone** to compile React directly in the browser (`Farmer (4).html` and `Vet_Fixed (2).html`). The Admin dashboard is Vanilla JS + Chart.js.
- **Backend Architecture:** Modular Node/Express REST API.
- **Database:** PostgreSQL managed via Prisma ORM.
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing.
- **APIs:** Standard REST JSON API at `http://localhost:5000/api/v1`.
- **External Services:** NONE. 
- **AI/ML Integrations:** NONE. (Simulated via static rules).
- **Map Integrations:** NONE. (Simulated via SVG drawing).
- **Storage:** Local filesystem (Base64 data URIs for images).
- **State Management:** React `useState` locally, persisted across tabs using `localStorage` event listeners.
- **Routing:** Handled manually via conditional component rendering in React (`if tab === 'dashboard'`).

**Important Files:**
- `index.html`: Main entry point, handles login, role selection, language switching. 
- `Farmer (4).html`: Complete React application for the Farmer role, bundled into one file.
- `Vet_Fixed (2).html`: Complete React application for the Vet role, bundled into one file.
- `PashuSakhi_Admin_Dashboard_Final.html`: Vanilla JS Admin dashboard.
- `pashusakhi_api.js`: The API client bridging the frontend to the backend.
- `backend/src/services/diagnostic.service.ts`: The "AI" rule engine.
- `backend/prisma/schema.prisma`: The single source of truth for the database architecture.
- `backend/prisma/seed.ts`: Crucial for demos. Pre-populates the DB with users, cases, and hotspots.

==================================================
PART 3 — FRONTEND AUDIT
==================================================

| Page | Route | Purpose | Functional? | Data Source | Important Actions |
|------|-------|---------|-------------|-------------|-------------------|
| Login | `index.html` | Authentication | ✅ Yes | DB / Mock Fallback | Login, Switch language |
| Farmer Dash | `Farmer (4).html` | Herd management & triage | ✅ Yes | DB / Mock Fallback | Add animal, Report symptoms, Chat |
| Vet Dash | `Vet_Fixed (2).html` | Case management | ✅ Yes | DB / Mock Fallback | Accept emergency, Prescribe |
| Admin Dash | `PashuSakhi_Admin_Dashboard_Final.html` | Epidemiological tracking | ✅ Yes | DB / Mock Fallback | View heatmap, Export reports |

**Notes:** The frontend is "Dual-Mode". If `pashusakhi_api.js` successfully connects to the backend, it uses real data. If the backend is offline, it falls back to a massive mocked state stored in `localStorage`. 

==================================================
PART 4 — USER FLOWS
==================================================

**Symptom Triage Flow (Actual Implementation):**
1. Entry: Farmer selects Animal -> clicks "Health Screening".
2. Farmer selects symptoms from a UI list.
3. API Call: `POST /api/v1/diagnostics/symptoms`.
4. Backend evaluates symptoms against hardcoded arrays.
5. Database: `ScreeningLog` is created.
6. Result: Returns static text (e.g., "Mild Indigestion") with a fake confidence score (e.g., "74%").
7. Vet views `ScreeningLog` on their dashboard and updates status to "Resolved".

**Emergency Flow:**
1. Entry: Farmer clicks "1962 Emergency".
2. API Call: `POST /api/v1/emergencies`.
3. Database: `Emergency` record created with `is1962HelplineInbound = true`.
4. Cross-tab trigger: A `localStorage` event forces the Vet dashboard to re-render.
5. Vet sees flashing red alert, clicks "Accept".
6. API Call: `POST /emergencies/:id/accept`.

==================================================
PART 5 — COMPONENT ARCHITECTURE
==================================================

Because the frontend uses Babel-Standalone, components are not split into files. They are defined globally inside script tags.

**Major Components (in Farmer/Vet HTML files):**
- `Card`: Reusable wrapper with neumorphic CSS styling.
- `AnimalAvatar` / Icons (`CowIcon`, `GoatIcon`): UI presentation.
- `Switch`, `SegmentedControl`: Form inputs.
- `DashboardView`, `AnimalsView`, `ChatView`: "Pages" rendered conditionally based on state. 

**Reuse:** Highly duplicated. `Farmer (4).html` and `Vet_Fixed (2).html` both duplicate the base UI components, icons, and state logic entirely.

==================================================
PART 6 — BACKEND / API AUDIT
==================================================

| Endpoint / Function | Method | Purpose | Input | Output | DB | External Service | Status |
|--------------------|--------|---------|-------|--------|----|------------------|--------|
| `/api/v1/auth/login` | POST | Authenticate user | email, pass | JWT, User | `User` | None | ✅ Real |
| `/api/v1/animals` | GET/POST | Manage herd | Animal fields | Animal[] | `Animal` | None | ✅ Real |
| `/api/v1/diagnostics/symptoms` | POST | Triage | symptoms[] | Result, Log | `ScreeningLog`| None | 🔵 Mocked AI |
| `/api/v1/emergencies` | POST | SOS | animalId, desc | Emergency | `Emergency` | None | ✅ Real DB |
| `/api/v1/consultations/*/messages`| POST | Chat | text, role | Message | `ChatMessage` | None | ✅ Real DB |

==================================================
PART 7 — DATABASE / DATA MODEL
==================================================

**Conceptual Data Model (Actual Prisma Schema):**
`User` (Farmer/Vet/Admin) 
  → 1:N `Animal`
  → 1:N `ScreeningLog` (Diagnostics)
  → 1:N `Consultation` (Telemedicine cases)
      → 1:N `ChatMessage`
  → 1:N `Treatment`
  → 1:N `Emergency`
  → 1:N `Notification`

**Independent Collections:**
- `OutbreakHotspot`: Standalone records with `latitude`/`longitude` and `mapX`/`mapY` used for the Admin heatmap.
- `Complaint`: System feedback.

**Persistence:** Fully persistent in PostgreSQL. Demo data is aggressively populated via `prisma/seed.ts`.

==================================================
PART 8 — AI / ML SYSTEM
==================================================

**Completely Mocked.** 

There are no ML models, no Gemini integrations, and no computer vision pipelines. 
If you look at `backend/src/services/diagnostic.service.ts`:
- **Input:** Array of symptom strings (e.g., `["sym_fever", "sym_lesions"]`).
- **Processing:** A deterministic `if/else` block. Example: `if (symptoms.includes("sym_bloat")) return "Acute Ruminal Tympany"`.
- **Confidence Handling:** Hardcoded numbers (e.g., `confidence: 89`).
- **Image Analysis:** The frontend accepts photo uploads via `FileReader`, converts them to Base64, but the backend simply ignores the image data and evaluates based on the accompanying dropdown selections.

==================================================
PART 9 — CASE MANAGEMENT
==================================================

**Actual Lifecycle Implemented:**
1. **Created:** `ScreeningLog` or `Emergency` or `Consultation` is created with `status = New`.
2. **Vet Assigned:** A vet opens the case, updating `assignedVetId`. `status` becomes `inConsultation` or `Under_Review`.
3. **Vet Report:** Vet prescribes treatment (creates a `Treatment` record tied to the animal).
4. **Resolved:** Vet updates the parent case status to `Resolved`.

This works seamlessly in the DB and UI.

==================================================
PART 10 — FARMER FEATURES
==================================================

- **Login/Auth:** ✅ Implemented
- **Animal Profiles:** ✅ Implemented
- **Symptom Triage:** 🔵 Mocked (Rule-based)
- **Photo Upload:** 🟡 Partial (Uploads to UI/DB as base64, but not actually analyzed)
- **Emergency / 1962 SOS:** 🟠 UI Only (Creates a DB record, but does not actually call emergency services)
- **Chat with Vet:** ✅ Implemented
- **Multilingual Support:** ✅ Implemented (Static Dictionary)

==================================================
PART 11 — VETERINARY FEATURES
==================================================

- **Vet Dashboard:** ✅ Implemented
- **Emergency Queue:** ✅ Implemented
- **Review Symptoms/Photos:** ✅ Implemented
- **Treatment Prescriptions:** ✅ Implemented
- **Location Tracking:** ❌ Missing (Vet location is just a static string in their profile).

==================================================
PART 12 — ADMIN / GOVERNMENT FEATURES
==================================================

- **Dashboard / Charts:** ✅ Implemented (Chart.js)
- **Disease Heatmap:** 🔵 Mocked (Custom SVG grid, not a real GIS system)
- **1962 Dispatch Integration:** 🟠 UI Simulation (Clicking "Dispatch 1962" shows a success toast, but communicates with no external government API).
- **Outbreak Detection:** 🔵 Mocked (Records are pre-seeded in DB, not calculated dynamically).

==================================================
PART 13 — MAP / GEOLOCATION SYSTEM
==================================================

**Completely simulated.**
There is no Google Maps, Leaflet, or Mapbox integration.
In `PashuSakhi_Admin_Dashboard_Final.html`, the map is an HTML `<svg>` element. Hotspots are fetched from the database, and their `mapX` and `mapY` coordinate columns dictate where a colored `<circle>` is drawn on the SVG canvas. Real GPS logic does not exist.

==================================================
PART 14 — NOTIFICATION SYSTEM
==================================================

**Simulated UI Notifications.**
The DB contains a `Notification` table. The frontend polls or receives `localStorage` events to show a red dot and a dropdown of alerts. There are no actual Push Notifications, WebSockets, Emails, or SMS messages sent.

==================================================
PART 15 — AUTHENTICATION & AUTHORIZATION
==================================================

- **Real Implementation:** `backend/src/middleware/auth.ts` uses JWT tokens and bcrypt. APIs are correctly protected.
- **Security Weaknesses:** The frontend falls back to massive `localStorage` dumps if the backend fails, meaning a user could theoretically alter their `localStorage` state to bypass UI restrictions if running in mock mode. (Standard for hackathons, do not fix).

==================================================
PART 16 — MULTILINGUAL SUPPORT
==================================================

✅ Implemented.
A custom `tt(lang, key)` function exists in the HTML files. It relies on a massive hardcoded dictionary object mapping English keys to Hindi, Marathi, Kokani, and Khandeshi.

==================================================
PART 17 — MOCK / DEMO DATA
==================================================

**CRITICAL SIH ASSET:**
`backend/prisma/seed.ts` is the heart of the demo. It wipes the database and creates a perfect "demo stage" every time it runs:
- Creates a farmer (Suresh), Vet (Dr. Aditi), Admin.
- Creates 4 specific animals (Gauri, Raju, Lakshmi, Moti) with varying health states.
- Pre-seeds chat messages, active treatments, an emergency (EMG-0512 for bloat), and 3 active outbreak hotspots (LSD, FMD, HS) placed specifically to look good on the SVG map.

==================================================
PART 18 — CURRENT ARCHITECTURE DIAGRAM
==================================================

```text
[Farmer React Browser]       [Vet React Browser]       [Admin Vanilla Browser]
     |         |                  |         |                 |
(REST API) (localStorage)    (REST API) (localStorage)   (REST API)
     |         |                  |         |                 |
     +---------+------------------+---------+                 |
               |                                              |
      [ Node.js Express Backend ] <---------------------------+
               |
      (Prisma ORM Queries)
               |
      [ PostgreSQL Database ]
```
*Note: Cross-browser real-time reactivity is faked using `window.addEventListener('storage')` between open tabs on the same machine.*

==================================================
PART 19 — CURRENT FEATURE INVENTORY
==================================================

| Feature | Status | Where Implemented | Real/Mock |
|---------|--------|--------------------|-----------|
| User Auth (JWT) | ✅ | Backend / All HTML | Real |
| Animal Profiles | ✅ | Farmer / Backend | Real |
| Symptom Triage | 🔵 | Backend Diagnostic Service | Mocked (Rule-based) |
| Live Chat | ✅ | Farmer / Vet / Backend | Real (DB + localStorage) |
| 1962 Emergency | 🟠 | Vet / Admin / Backend | UI/DB Only (No real dispatch) |
| Disease Map | 🔵 | Admin Dashboard | Mocked (SVG generation) |
| Notifications | 🟠 | All HTML / Backend | UI/DB Only |
| Multilingual UI | ✅ | Farmer / index.html | Real (Static Dictionary) |

==================================================
PART 20 — WHAT IS ACTUALLY WORKING
==================================================

**Biggest Strengths:**
1. **The UI/UX is outstanding.** It looks like a finished, polished production application.
2. **The Demo Flow is unbreakable.** The fallback `localStorage` bridging ensures the pitch works even if the Node server crashes on stage.
3. **Database Schema:** The Prisma schema is very well thought out, highly relational, and ready for a real production backend.

==================================================
PART 21 — WHAT IS WEAK / INCOMPLETE
==================================================

**Biggest Gaps:**
1. **Frontend Architecture:** Compiling React via Babel Standalone inside 8,000-line HTML files is a maintenance nightmare.
2. **Missing AI:** Triage relies entirely on string matching.
3. **Missing Maps:** No actual geospatial indexing or map tiles.
4. **No Media Storage:** Images are saved as Base64 strings, which will immediately bloat the DB and crash the browser if large photos are uploaded.

==================================================
PART 22 — FEATURE DEPENDENCY MAP
==================================================

`User (Farmer)`
   ↓ owns
`Animal`
   ↓ triggers
`ScreeningLog` (relies on Diagnostic logic)
   ↓ creates
`Emergency` / `Consultation`
   ↓ triggers cross-tab sync via
`localStorage('psk_bridge_event')`
   ↓ updates
`Vet UI`
   ↓ creates
`Treatment`

==================================================
PART 23 — EXTENSIBILITY
==================================================

- **Backend:** EASY TO EXTEND. Clean Express structure, Prisma ORM. Swapping the fake diagnostic service with a real Gemini API call will take 10 minutes.
- **Database:** EASY TO EXTEND.
- **Frontend:** DIFFICULT AND RISKY. Touching the 8,000-line HTML files is dangerous. You cannot use `npm install` for frontend packages. Everything must be brought in via CDN script tags.

==================================================
PART 24 — "DO NOT BREAK THIS" LIST
==================================================

1. **`pashusakhi_api.js`**: Do not alter how the `fetch` wrapper handles errors, as the frontend relies on silent failures to trigger its `localStorage` fallback.
2. **`localStorage` event listeners**: Do not remove `window.addEventListener('storage')`. It will break the real-time illusion of the demo.
3. **`backend/prisma/seed.ts`**: Do not delete the specific animal names and coordinates, as the UI hardcodes some checks/map points expecting them.
4. **Babel Standalone scripts**: Do not convert the HTML files to JSX files assuming a bundler exists. There is no bundler.

==================================================
PART 25 — SIH DEMO FLOW
==================================================

**Current Intended Demo ("The Hero Flow"):**
1. Judge opens `index.html`.
2. Clicks "Farmer Demo". Logs in as Suresh.
3. Views the multilingual dashboard, switches language to Marathi.
4. Clicks on the sick buffalo "Raju". Submits a symptom report.
5. *Pitch point: "Our AI analyzes this..."* -> The rule-engine fires, returning "Acute Bovine Pyrexia".
6. Farmer clicks "1962 Emergency SOS".
7. Switch to second browser tab (`Vet_Fixed (2).html`). The screen flashes red via localStorage event. Vet accepts the case.
8. Switch to third browser tab (`Admin.html`). Admin looks at the disease cluster map, seeing a simulated hotspot in Nashik.

==================================================
PART 26 — FINAL TECHNICAL SUMMARY
==================================================

**PROJECT:**
PashuSakhi — Smart Livestock Healthcare Platform & Telemedicine Ecosystem.

**CURRENT STATE:**
Hackathon Prototype / High-Fidelity Demo.

**TECH STACK:**
Node, Express, Prisma, PostgreSQL. Frontend is vanilla HTML/JS and Babel-compiled React directly in the browser.

**FRONTEND:**
Zero-build single-file HTML apps. Massive reliance on inline CSS, base64 images, and `localStorage` syncing.

**BACKEND:**
Clean, modular REST API.

**DATABASE:**
PostgreSQL. Highly relational and mature schema.

**AI/ML:**
Completely fake. Implemented via deterministic `if/else` substring matching.

**AUTH:**
Real JWT and bcrypt in the backend.

**MAP:**
Completely fake. Custom SVG drawings.

**NOTIFICATIONS:**
Mocked in UI via DB polling / storage events.

**FARMER FEATURES:**
Herd management, mock triage, mock SOS dispatch.

**VET FEATURES:**
Case queue, emergency acceptance, clinical prescribing.

**ADMIN FEATURES:**
KPI dashboard, SVG heatmaps.

**GOVERNMENT INTEGRATION:**
None (UI text only).

**MOCK SYSTEMS:**
AI Triage, GIS/Maps, Real-Time WebSockets (simulated via localStorage), Push Notifications.

**MAIN WORKING FLOW:**
Farmer registers symptom -> Auto-classified by rule engine -> Vet receives alert -> Vet prescribes.

**BIGGEST STRENGTHS:**
Flawless UX/UI, robust DB schema, unbreakable demo due to dual-mode architecture.

**BIGGEST GAPS:**
No actual AI, no actual map libraries, frontend is structurally unscalable (8k line HTML files).

**MOST IMPORTANT FILES:**
`Farmer (4).html`, `Vet_Fixed (2).html`, `diagnostic.service.ts`, `seed.ts`.

**MOST IMPORTANT APIs:**
`/api/v1/diagnostics/symptoms`, `/api/v1/emergencies`.

**MOST IMPORTANT DATABASE ENTITIES:**
`Animal`, `ScreeningLog`, `Emergency`, `OutbreakHotspot`.

**ARCHITECTURAL RISKS:**
Frontend maintenance is a nightmare; base64 photo uploads will quickly crash the database.

**EASIEST AREAS TO EXTEND:**
Connecting real AI (Gemini) to the `diagnostic.service.ts` endpoint.

**AREAS THAT REQUIRE CARE:**
Modifying the React logic inside the HTML files.

**CURRENT SIH DEMO:**
Fully capable of being pitched to judges today as a "working" end-to-end simulation.

---

# AI HANDOFF CONTEXT

**PROJECT OVERVIEW**
PashuSakhi is a Smart India Hackathon (SIH) prototype for a rural livestock telemedicine, triage, and epidemiological tracking platform. It serves Farmers, Vets, and Admins.

**CURRENT IMPLEMENTATION LEVEL**
The project operates as a "Dual-Mode" high-fidelity prototype. The backend (Node/Express/Prisma/PostgreSQL) provides real CRUD, authentication, and database persistence. However, the Frontend acts as a resilient facade: if the backend is down, it falls back to a massive `localStorage` mock state. 

**HOW THE CODE WORKS**
- **Backend:** Clean modular Express.js REST API.
- **Frontend (CRITICAL QUIRK):** The frontend does **not** use Vite, Webpack, or Next.js. The Farmer and Vet applications (`Farmer (4).html`, `Vet_Fixed (2).html`) are massive, single-file HTML documents. They use `<script type="importmap">` to load React/Lucide from CDNs, and `<script src="babel.min.js">` to compile the inline React JSX directly in the browser on load. **Do not attempt to use `npm install` for the frontend or separate components into `.jsx` files.** 
- **Real-Time Illusion:** There are no WebSockets. Real-time updates between the Farmer, Vet, and Admin tabs are faked using `window.addEventListener('storage')` listening for cross-tab local storage events (`psk_bridge_event`).

**WHAT IS REAL**
- The PostgreSQL database schema (Animals, Consultations, Treatments).
- JWT Authentication.
- Multilingual static dictionaries.

**WHAT IS MOCKED**
- **AI Triage:** The `diagnostic.service.ts` uses static `if/else` substring matching (e.g., if input includes "bloat", return 89% confidence). There are no real ML models.
- **Maps:** The admin heatmap is a custom SVG grid using hardcoded `mapX`/`mapY` coordinates. No Leaflet or Google Maps.
- **External APIs (1962 Helpline):** Purely UI flags. 
- **Image Uploads:** Uploaded as raw Base64 Data URIs to the database.

**WHAT MUST NOT BE BROKEN**
- **The LocalStorage Bridge:** Do not strip out the fallback logic in `pashusakhi_api.js` or the storage event listeners, as this protects the demo from crashing.
- **The DB Seed File (`seed.ts`):** The frontend relies heavily on the specific mocked IDs and coordinates populated by this script.

**FUTURE FEATURE INTEGRATION (How to plug in)**
The easiest path for future development is upgrading the backend services while leaving the brittle frontend alone. To add real AI, locate `backend/src/services/diagnostic.service.ts` and replace the deterministic `evaluateSymptoms` method with a real API call to Gemini or an ML service, returning data matching the existing `DiagnosticResult` interface. Do not attempt to refactor the frontend HTML into a modern SPA build system unless given explicit permission, as it will break the entire UI.
