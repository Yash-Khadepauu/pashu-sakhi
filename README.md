# 🐄 PashuSakhi

### Smart Livestock Healthcare, Veterinary Telemedicine & Disease Early-Warning Platform

> **Smart India Hackathon (SIH) Prototype**
> **Problem Statement:** 26128 — *Efficient systems for early detection, prevention, and management of livestock diseases and animal health issues*
> **Organization:** Government of Maharashtra

---

## 📌 Overview

**PashuSakhi** is a high-fidelity SIH prototype for a digital livestock-health ecosystem connecting:

* 👨‍🌾 Farmers
* 👨‍⚕️ Veterinarians
* 🏛️ Government / System Administrators

The platform is designed around a simple idea:

> **One sick animal can be an early signal of a much larger problem.**

PashuSakhi currently provides:

* Farmer authentication
* Animal/herd management
* Symptom-based health screening
* Veterinary case management
* Emergency / 1962 workflow simulation
* Farmer–vet consultation and chat
* Treatment management
* Multilingual UI
* Administrative disease-hotspot dashboard
* Demo disease intelligence
* Persistent PostgreSQL data
* Resilient localStorage-based demo fallback

The current application is a **hackathon prototype**, not a production veterinary or government system.

---

# 🎯 SIH Problem Alignment

The SIH problem statement focuses on creating a unified animal-health surveillance and decision-support system capable of early detection, reporting, triage, geospatial risk mapping, health records, multilingual alerts, case escalation, veterinary coordination, and operation in low-connectivity environments.

PashuSakhi's intended architecture is centered around:

```text
Farmer
   ↓
Animal Health Report
   ↓
Screening / Triage
   ↓
Risk Assessment
   ↓
Veterinary Escalation
   ↓
Case Management
   ↓
Veterinary Outcome
   ↓
Disease Intelligence
   ↓
Geographic / Outbreak Detection
   ↓
Alerts & Preventive Action
```

The current prototype implements portions of this loop at different levels of maturity.

**Important:** Features described as future SIH capabilities must not be interpreted as currently implemented unless explicitly marked as implemented below.

---

# 🏗️ Current Architecture

PashuSakhi currently uses a **dual-mode architecture**.

```text
                ┌───────────────────────┐
                │     Farmer Browser    │
                │    React + HTML       │
                └───────────┬───────────┘
                            │
                            │ REST API
                            │
                ┌───────────▼───────────┐
                │   Express.js Backend  │
                │      REST API         │
                └───────────┬───────────┘
                            │
                       Prisma ORM
                            │
                ┌───────────▼───────────┐
                │   PostgreSQL Database │
                └───────────────────────┘


                ┌───────────────────────┐
                │      Vet Browser      │
                └───────────┬───────────┘
                            │
                            │ REST API
                            ▼
                       Express API


                ┌───────────────────────┐
                │     Admin Browser     │
                │ Vanilla JS + Chart.js │
                └───────────┬───────────┘
                            │
                            ▼
                       Express API
```

### Dual-mode behavior

When the backend is available:

```text
Frontend → REST API → PostgreSQL
```

When the backend is unavailable:

```text
Frontend
   ↓
API failure
   ↓
localStorage fallback
   ↓
Mock/demo application state
```

This fallback is intentionally useful for SIH demonstrations because it allows the UI to remain operational even if the backend is unavailable.

---

# 🧰 Technology Stack

## Backend

* Node.js
* Express.js
* TypeScript
* Prisma ORM
* PostgreSQL
* JWT authentication
* bcrypt password hashing
* REST/JSON APIs

## Farmer / Vet Frontend

* HTML
* JavaScript
* React
* Babel Standalone
* React loaded through browser/CDN mechanisms
* Inline CSS
* localStorage

## Admin Frontend

* HTML
* Vanilla JavaScript
* Chart.js
* Custom SVG visualization

## Current External Services

There are currently **no real external service integrations**.

Specifically:

* No real AI API
* No Gemini integration
* No real GIS provider
* No Google Maps
* No Leaflet
* No Mapbox
* No WebSockets
* No real 1962 government API
* No push notification provider
* No SMS provider

---

# 📁 Important Project Files

The following files are particularly important to understand the current application.

| File                                         | Purpose                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| `index.html`                                 | Main entry point, authentication, role selection and language switching |
| `Farmer (4).html`                            | Complete Farmer application                                             |
| `Vet_Fixed (2).html`                         | Complete Veterinarian application                                       |
| `PashuSakhi_Admin_Dashboard_Final.html`      | Administrative dashboard                                                |
| `pashusakhi_api.js`                          | Frontend API client and fallback bridge                                 |
| `backend/src/services/diagnostic.service.ts` | Current rule-based diagnostic/triage engine                             |
| `backend/prisma/schema.prisma`               | Database schema                                                         |
| `backend/prisma/seed.ts`                     | Demo database seed and synthetic data                                   |

---

# 👥 User Roles

## 👨‍🌾 Farmer

Current capabilities include:

* Login
* Animal/herd management
* Symptom reporting
* Health screening
* Photo upload
* Emergency/SOS workflow
* Veterinary consultation
* Chat
* Treatment/history information
* Multilingual interface

---

## 👨‍⚕️ Veterinarian

Current capabilities include:

* Vet dashboard
* Case queue
* Emergency queue
* Review farmer-reported symptoms
* Review uploaded photos
* Accept emergencies
* Prescribe treatments
* Update case status
* Communicate with farmers

---

## 🏛️ Administrator

Current capabilities include:

* Administrative dashboard
* KPI visualization
* Disease hotspot visualization
* Case monitoring
* Demo outbreak information
* Report/export functionality

---

# 🔄 Current Farmer → Vet Workflow

The currently implemented symptom workflow is:

```text
Farmer
   ↓
Select Animal
   ↓
Health Screening
   ↓
Select Symptoms
   ↓
POST /api/v1/diagnostics/symptoms
   ↓
Rule-Based Diagnostic Engine
   ↓
ScreeningLog created
   ↓
Risk / Result displayed
   ↓
Vet can review case
   ↓
Treatment / Resolution
```

The current diagnostic engine is **not an actual machine-learning model**.

---

# 🚨 Current Emergency / 1962 Workflow

The emergency workflow currently works as a prototype simulation:

```text
Farmer
   ↓
1962 Emergency / SOS
   ↓
POST /api/v1/emergencies
   ↓
Emergency record created
   ↓
localStorage cross-tab event
   ↓
Vet dashboard reacts
   ↓
Emergency appears
   ↓
Vet accepts emergency
   ↓
Case continues in veterinary workflow
```

### Important limitation

PashuSakhi does **not currently communicate with the real Maharashtra 1962 government backend**.

The current implementation creates a database record and simulates the dispatch workflow.

Do not describe this as a real government API integration unless authorized integration is actually implemented.

---

# 💬 Farmer–Veterinarian Chat

The application contains a database-backed consultation/chat workflow.

Conceptually:

```text
Farmer
   ↓
Consultation
   ↓
Chat Messages
   ↓
Vet
```

Messages are persisted through the backend.

Cross-tab synchronization is supplemented by localStorage-based behavior.

There are currently no WebSockets.

---

# 🤖 AI / ML Status

## Current Status: MOCKED

The current application does **not** contain:

* A trained ML model
* Computer vision inference
* Gemini API integration
* Image classification
* Real AI disease reasoning

Instead, the current diagnostic service uses deterministic rule-based logic.

Conceptually:

```text
Symptoms
   ↓
Hardcoded Rules
   ↓
Condition
   ↓
Hardcoded Confidence
   ↓
Screening Result
```

For example, symptom combinations can trigger predetermined conditions.

Confidence values are currently static/demo values.

---

# 📷 Image Analysis Status

The Farmer UI accepts image uploads.

The current process is approximately:

```text
Photo
   ↓
FileReader
   ↓
Base64 Data URI
   ↓
Frontend / Database
```

However:

> **The uploaded image is currently not analyzed by an AI/ML model.**

The current diagnostic backend primarily evaluates the accompanying symptom selections.

---

# 🗺️ Disease Map Status

## Current Status: MOCKED

The Admin dashboard currently does **not** use a real geographic map provider.

There is:

* No Google Maps
* No Leaflet
* No Mapbox
* No GIS tile system
* No real geospatial indexing

Instead, the dashboard uses a custom SVG visualization.

Conceptually:

```text
Database Hotspot
   ↓
mapX / mapY
   ↓
SVG Canvas
   ↓
Colored Circle
```

The seeded hotspot data is therefore designed for the prototype visualization rather than being a production GIS implementation.

---

# 📊 Outbreak Detection Status

## Current Status: MOCKED

The application currently displays seeded outbreak/hotspot information.

The current prototype does **not yet dynamically calculate outbreaks from incoming cases** using an epidemiological detection algorithm.

Future outbreak detection can potentially use:

* Case count
* Confirmed cases
* Suspected cases
* Disease type
* Geographic distance
* Time window
* Historical baseline
* Rate of increase
* Animal population

---

# 🔔 Notification Status

The database contains notification records and the frontend provides notification UI.

However, the current application does not send actual:

* Push notifications
* SMS
* Email
* External alert messages

The current notification experience is simulated using database state, polling/storage events, and frontend UI.

---

# 🌐 Multilingual Support

Multilingual support is currently implemented through a static translation dictionary.

The application includes language resources for:

* English
* Hindi
* Marathi
* Kokani
* Khandeshi

The main translation mechanism is the custom:

```text
tt(lang, key)
```

function.

The current approach is suitable for a prototype but may eventually be replaced by a more scalable localization architecture.

---

# 🗄️ Database

PashuSakhi uses:

```text
PostgreSQL
      ↓
Prisma ORM
```

The database is relational and persistent.

Major entities include:

```text
User
 ├── Animal
 ├── ScreeningLog
 ├── Consultation
 │     └── ChatMessage
 ├── Treatment
 ├── Emergency
 └── Notification

OutbreakHotspot

Complaint
```

---

# 🧬 Core Data Relationships

A simplified representation is:

```text
User
 │
 ├──────────────► Animal
 │                  │
 │                  ├──► ScreeningLog
 │                  │
 │                  ├──► Treatment
 │                  │
 │                  └──► Emergency
 │
 ├──────────────► Consultation
 │                    │
 │                    └──► ChatMessage
 │
 └──────────────► Notification


OutbreakHotspot
```

The complete database structure should be treated as defined by:

```text
backend/prisma/schema.prisma
```

---

# 🔐 Authentication

Authentication is implemented using:

```text
Password
   ↓
bcrypt
   ↓
JWT
   ↓
Authenticated API Requests
```

The backend contains authentication middleware for protecting API resources.

### Prototype limitation

When the application switches into localStorage fallback mode, frontend state can potentially be manipulated by a user.

This is acceptable as a hackathon/demo fallback but should not be considered production-grade authorization.

---

# 🔌 API

The backend exposes a REST API under:

```text
http://localhost:5000/api/v1
```

Important current endpoints include:

```text
POST /api/v1/auth/login

GET  /api/v1/animals
POST /api/v1/animals

POST /api/v1/diagnostics/symptoms

POST /api/v1/emergencies

POST /api/v1/emergencies/:id/accept

/api/v1/consultations/*/messages
```

The exact API implementation should be verified against the backend source before making changes.

---

# 🌱 Demo / Seed Data

`backend/prisma/seed.ts` is an important part of the SIH demonstration.

The seed creates synthetic demo data including:

* Farmer account
* Veterinarian account
* Administrator account
* Demo animals
* Health states
* Chat messages
* Treatments
* Emergency cases
* Disease hotspots
* Demo outbreak information

Known demo animals include:

```text
Gauri
Raju
Lakshmi
Moti
```

The seed also creates predefined hotspot data for the administrative disease visualization.

### Important

This is **synthetic/demo data**.

It must not be represented as real government surveillance data or real farmer records.

---

# 🔄 Real vs Mock Feature Matrix

| Feature                 | Current Status | Reality                   |
| ----------------------- | -------------- | ------------------------- |
| User Authentication     | ✅ Implemented  | Real JWT + bcrypt         |
| Animal Profiles         | ✅ Implemented  | Real DB                   |
| PostgreSQL              | ✅ Implemented  | Real                      |
| Prisma                  | ✅ Implemented  | Real                      |
| Symptom Triage          | 🔵 Mocked      | Rule-based                |
| AI Disease Detection    | ❌ Missing      | No actual AI              |
| ML Image Classification | ❌ Missing      | No model                  |
| Photo Upload            | 🟡 Partial     | Base64; not analyzed      |
| Vet Dashboard           | ✅ Implemented  | Real UI + backend         |
| Emergency Workflow      | 🟡 Partial     | DB/UI simulation          |
| 1962 Integration        | 🟠 Simulated   | No government API         |
| Farmer–Vet Chat         | ✅ Implemented  | DB + localStorage         |
| Disease Map             | 🔵 Mocked      | SVG visualization         |
| Real GIS                | ❌ Missing      | No GIS provider           |
| Outbreak Detection      | 🔵 Mocked      | Seeded/demo data          |
| Notifications           | 🟠 Simulated   | No external delivery      |
| Multilingual UI         | ✅ Implemented  | Static dictionary         |
| Government Integration  | ❌ Missing      | No real integration       |
| WebSockets              | ❌ Missing      | localStorage simulation   |
| Offline Mode            | ❌ Missing      | Not a true offline system |

---

# ⭐ Current Strengths

## 1. High-Fidelity UI/UX

The current application has a polished, highly interactive interface suitable for an SIH demonstration.

## 2. Strong Backend Foundation

The Express + Prisma + PostgreSQL architecture provides a real persistent backend rather than being purely frontend mockup code.

## 3. Working Authentication

JWT and bcrypt provide a genuine authentication layer.

## 4. Relational Data Model

The Prisma schema already supports users, animals, cases/consultations, treatments, messages, emergencies and notifications.

## 5. Resilient Demo Architecture

The localStorage fallback provides a safety net for demonstrations.

## 6. Complete Conceptual Story

Even though several components are currently simulated, the product already communicates a strong:

```text
Farmer
 ↓
Health Problem
 ↓
Triage
 ↓
Vet
 ↓
Treatment
 ↓
Disease Intelligence
```

story.

---

# ⚠️ Current Technical Limitations

## 1. Frontend Architecture

The Farmer and Vet applications are very large single-file HTML applications.

They contain substantial amounts of:

* JSX
* JavaScript
* CSS
* state management
* UI components

inside individual files.

This makes future frontend changes more difficult and risky.

---

## 2. AI Is Not Yet Real

The current diagnostic system is deterministic rule-based logic.

The project does not yet have:

* Image ML
* Computer vision
* Gemini reasoning
* Model evaluation
* Confidence calibration

---

## 3. Maps Are Not Real GIS

The current disease map is an SVG visualization.

There is no real geographic map system.

---

## 4. Image Storage

Images are currently handled as Base64 data.

Large image uploads could significantly increase database size and browser memory usage.

A future production architecture should use object storage rather than storing large Base64 payloads directly in relational records.

---

## 5. Real-Time Communication

There are no WebSockets.

Cross-tab behavior relies on browser localStorage events.

This is useful for the prototype but is not equivalent to production real-time infrastructure.

---

# 🛡️ DO NOT BREAK

Future development should be especially careful around the following:

### `pashusakhi_api.js`

The API wrapper contains fallback behavior that allows the frontend to switch to localStorage-backed demo state.

Changing its error-handling behavior can break the demo fallback.

### localStorage bridge

The application uses:

```javascript
window.addEventListener('storage', ...)
```

and the:

```text
psk_bridge_event
```

mechanism.

Removing this can break cross-tab demo synchronization.

### `backend/prisma/seed.ts`

The demo seed is important for the current SIH presentation.

Be careful when modifying:

* demo users
* animal IDs
* animal names
* hotspot coordinates
* seeded cases

### Babel Standalone

The current Farmer/Vet frontend is not a conventional Vite/Next.js/React build.

Do not assume that:

```text
npm install
```

will install or build the frontend application.

The frontend currently relies heavily on browser/CDN scripts and Babel Standalone.

---

# 🧪 Current SIH Demo Flow

The current demonstration can be presented as:

```text
1. Open index.html
        ↓
2. Enter Farmer Demo
        ↓
3. Login as demo farmer
        ↓
4. View Farmer Dashboard
        ↓
5. Select demo animal
        ↓
6. Submit symptoms
        ↓
7. Rule-based screening result
        ↓
8. Trigger 1962 Emergency
        ↓
9. Open Vet application
        ↓
10. Vet receives simulated alert
        ↓
11. Vet accepts case
        ↓
12. Vet prescribes treatment
        ↓
13. Admin opens dashboard
        ↓
14. Admin views disease hotspot visualization
```

This demonstrates the **conceptual end-to-end workflow**, but several stages are simulated rather than connected to real external systems.

---

# 🚀 Future Development Direction

The strongest path forward is to improve the existing system incrementally rather than rebuilding the entire application immediately.

Potential architecture:

```text
Current Frontend
       ↓
Existing REST API
       ↓
Replace / Upgrade Backend Services
       ↓
Real AI
       ↓
Real Geospatial Intelligence
       ↓
Real Case Intelligence
       ↓
Real Alert Infrastructure
```

---

# 🤖 Future AI Architecture

A potential future screening pipeline is:

```text
Animal Photo
      ↓
Image Quality Check
      ↓
Computer Vision / ML
      ↓
Observable Features
      ↓
AI Reasoning
      ↓
Symptoms + Animal Context
      ↓
Risk Assessment
      ↓
Recommended Action
```

The frontend should ideally remain independent of the specific model implementation.

A replaceable service boundary should be maintained.

---

# 🗺️ Future Disease Intelligence

A future production-oriented architecture can evolve toward:

```text
Individual Cases
       ↓
Disease Records
       ↓
Geographic Aggregation
       ↓
Temporal Analysis
       ↓
Cluster Detection
       ↓
Outbreak Risk
       ↓
Alert Engine
       ↓
Farmers / Vets / Officials
```

This would move the current prototype from seeded visualization toward actual disease surveillance.

---

# 🏛️ Government Integration

The current project does **not** have a real government API integration.

Future integration should use an adapter architecture rather than directly coupling the application to a government system.

Conceptually:

```text
PashuSakhi
    ↓
Government Integration Adapter
    ↓
Authorized Government System
```

Potential future integration targets may include relevant livestock-health government infrastructure, subject to actual authorization and API availability.

Never claim government integration unless authorized access has actually been obtained.

---

# 📦 Fresh PC Setup

This section is intentionally conservative.

The current audit does not provide enough verified information to safely specify the exact Node.js version, package manager, environment variables, PostgreSQL credentials, or database initialization commands.

Therefore, **before relying on this section for a completely fresh machine, verify the repository's actual ****`package.json`****, backend configuration, ****`.env`**** requirements, Prisma configuration and database setup.**

## Prerequisites

The machine should have:

* Git
* Node.js
* npm or the package manager specified by the repository
* PostgreSQL
* A modern web browser

Verify the exact required versions before development.

---

## 1. Clone the Repository

```bash
git clone <GITHUB_REPOSITORY_URL>
cd <PROJECT_DIRECTORY>
```

---

## 2. Install Backend Dependencies

Navigate to the backend directory:

```bash
cd backend
```

Then install dependencies using the package manager defined by the repository.

For npm-based projects this will normally be:

```bash
npm install
```

> Verify the repository's actual `package.json` and lockfile before running this on a clean machine.

---

## 3. Configure Environment Variables

Create the environment file required by the backend.

The exact variables must be taken from the repository's configuration.

Typical categories may include:

```text
DATABASE_URL
JWT_SECRET
PORT
```

Do **not** commit secrets or API keys to GitHub.

Example:

```env
DATABASE_URL=<YOUR_POSTGRESQL_CONNECTION_STRING>
JWT_SECRET=<YOUR_SECRET>
PORT=5000
```

The exact variable names must be verified against the actual backend source.

---

## 4. Configure PostgreSQL

Create/configure the PostgreSQL database required by Prisma.

Then configure:

```text
DATABASE_URL
```

in the backend environment.

---

## 5. Initialize Prisma

Use the Prisma commands specified by the repository.

Typical development workflow:

```bash
npx prisma generate
npx prisma migrate dev
```

If the project is intended to use an existing schema/database rather than migrations, follow the repository's actual Prisma configuration instead.

---

## 6. Seed Demo Data

The SIH prototype depends heavily on its demo seed.

The seed file is:

```text
backend/prisma/seed.ts
```

Run the repository's configured Prisma seed command.

A typical command is:

```bash
npx prisma db seed
```

The exact command should be verified against `package.json` / Prisma configuration.

---

## 7. Start the Backend

From the backend directory:

```bash
npm run dev
```

The current audit indicates that the REST API is expected at:

```text
http://localhost:5000/api/v1
```

---

## 8. Start the Frontend

The Farmer and Vet applications are currently standalone HTML applications rather than a conventional frontend build.

Important files include:

```text
index.html
Farmer (4).html
Vet_Fixed (2).html
PashuSakhi_Admin_Dashboard_Final.html
```

The exact serving method should be verified from the repository.

Because the application uses browser/CDN scripts and browser-side Babel, do not automatically assume that it requires a Vite/Next.js frontend server.

---

# 🩺 Demo Accounts

The project seed creates demo users.

The audit identifies:

```text
Farmer: Suresh
Veterinarian: Dr. Aditi
Administrator: Demo Admin
```

The exact login credentials should be obtained from:

```text
backend/prisma/seed.ts
```

Do not hardcode credentials in this README unless they are intentionally public demo credentials.

---

# 🐛 Troubleshooting

## Backend is not responding

Check that:

1. PostgreSQL is running.
2. The database exists.
3. `DATABASE_URL` is correct.
4. Prisma has been generated.
5. The backend server is running.
6. Port `5000` is available.

---

## Farmer/Vet UI is not receiving updates

Check that:

* Both applications are open in browser tabs/windows.
* Browser localStorage is enabled.
* The `storage` event listener has not been removed.
* `psk_bridge_event` functionality has not been modified.

---

## Demo data is missing

Recheck the Prisma seed process.

The primary demo seed is:

```text
backend/prisma/seed.ts
```

---

## Frontend packages cannot be installed

This may be expected.

The current Farmer/Vet frontend is not structured as a conventional npm-built React application.

It uses browser/CDN imports and Babel Standalone.

---

# 📋 Development Rules

Before adding a new feature, determine:

### 1. Does the feature help?

* Earlier livestock-health detection?
* Better farmer action?
* Faster veterinary care?
* Better case/outcome data?
* Earlier disease-spread detection?
* Better action by farmers, vets or officials?

### 2. What layer should change?

```text
UI
↓
API
↓
Service
↓
Database
↓
External Integration
```

### 3. Is the feature:

```text
MVP
Prototype
Future
```

### 4. Does it break:

* localStorage fallback?
* existing APIs?
* seeded demo data?
* authentication?
* Farmer/Vet workflows?
* current SIH demo?

---

# 🧭 Current Development Priority

The current application should be improved incrementally.

A logical progression is:

```text
CURRENT
   │
   ├── Existing polished UI
   ├── Existing backend
   ├── Existing PostgreSQL
   ├── Existing authentication
   └── Existing demo workflows
            │
            ▼
       REAL AI SCREENING
            │
            ▼
       BETTER IMAGE PIPELINE
            │
            ▼
       REAL GEO INTELLIGENCE
            │
            ▼
       DYNAMIC OUTBREAK DETECTION
            │
            ▼
       BETTER ALERT SYSTEM
            │
            ▼
       AUTHORIZED GOVERNMENT INTEGRATION
```

The goal is to strengthen the existing prototype rather than introduce unnecessary scope.

---

# ⚠️ Prototype Disclaimer

PashuSakhi is a **Smart India Hackathon prototype**.

The current application contains simulated components for demonstration purposes.

In particular:

* AI diagnosis is simulated by rule-based logic.
* Image analysis is not currently performed by a trained ML model.
* Disease mapping is simulated using SVG.
* Outbreak information is seeded/demo data.
* 1962 integration is simulated.
* Notifications are simulated.
* Real-time synchronization uses browser localStorage mechanisms.

The application must not present simulated government integrations, AI diagnoses, disease confirmations or surveillance data as real-world facts.

---

# 🏁 Current Project Status

| Area                       | Status                     |
| -------------------------- | -------------------------- |
| UI/UX                      | 🟢 High-fidelity prototype |
| Farmer Application         | 🟢 Functional              |
| Vet Application            | 🟢 Functional              |
| Admin Dashboard            | 🟢 Functional              |
| Backend API                | 🟢 Functional              |
| PostgreSQL                 | 🟢 Functional              |
| Prisma                     | 🟢 Functional              |
| Authentication             | 🟢 Functional              |
| Animal Management          | 🟢 Functional              |
| Veterinary Workflow        | 🟢 Functional              |
| Chat                       | 🟢 Functional              |
| AI/ML                      | 🔴 Not implemented         |
| Image Analysis             | 🔴 Not implemented         |
| Real GIS                   | 🔴 Not implemented         |
| Dynamic Outbreak Detection | 🔴 Not implemented         |
| Real 1962 Integration      | 🔴 Not implemented         |
| External Notifications     | 🔴 Not implemented         |
| True Offline Mode          | 🔴 Not implemented         |

---

# 📖 AI / Developer Handoff

For future development, treat the following as the current source of truth:

> PashuSakhi is a high-fidelity SIH prototype consisting of standalone browser-based Farmer and Vet React applications, a Vanilla JS Admin dashboard, and a modular Express/TypeScript backend backed by PostgreSQL and Prisma.
>
> Authentication and database persistence are real. The application supports farmer animal management, symptom screening, veterinary case handling, treatment records, emergency records, consultations and multilingual UI.
>
> The current diagnostic engine is rule-based rather than machine-learning based. Uploaded images are converted to Base64 but are not currently analyzed by an ML model. The disease map is a custom SVG visualization rather than a real GIS system. The 1962 emergency workflow is a database/UI simulation and does not connect to a government backend. Outbreak data is currently seeded rather than dynamically detected.
>
> The Farmer and Vet applications are large single-file HTML applications using React, browser/CDN imports and Babel Standalone. They do not use a conventional Vite/Next/Webpack frontend build. The API client contains a localStorage fallback, and cross-tab synchronization uses the `storage` event and `psk_bridge_event`.
>
> The backend is the safest place to add major new service functionality. Future AI integration should ideally replace or extend the existing diagnostic service while maintaining the existing response contract. Future government integrations should use an adapter boundary. Future mapping should replace the current SVG visualization without unnecessarily changing the underlying case/data architecture.
>
> Preserve the existing demo fallback, seed data, authentication, API behavior and SIH demonstration flow unless a deliberate architectural migration has been approved.

---

# 📚 Repository Structure — High-Level

```text
PashuSakhi/
│
├── index.html
├── Farmer (4).html
├── Vet_Fixed (2).html
├── PashuSakhi_Admin_Dashboard_Final.html
├── pashusakhi_api.js
│
└── backend/
    ├── src/
    │   ├── services/
    │   │   └── diagnostic.service.ts
    │   └── ...
    │
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.ts
    │
    └── ...
```

The exact repository tree should be checked directly against the current GitHub repository because this document intentionally focuses on the architecture identified during the audit.

---

# 📄 Documentation Status

This README describes the **current audited prototype architecture**.

It should be updated whenever major architectural changes are introduced, particularly:

* AI/ML integration
* Frontend migration
* Database schema changes
* GIS integration
* Government API integration
* Notification infrastructure
* Offline functionality
* Authentication changes

---

## 🐄 PashuSakhi

> **From a sick animal to an early warning for the community.**

# 🔑 Demo Login Credentials

The following accounts are available for demonstrating the current PashuSakhi prototype.

> **These are demo credentials intended for the SIH prototype. Do not reuse these credentials in a production deployment.**

| Role               | Email                  | Password    |
| ------------------ | ---------------------- | ----------- |
| 👨‍🌾 Farmer       | `farmer@pashusakhi.in` | `farmer123` |
| 👨‍⚕️ Veterinarian | `vet@pashusakhi.in`    | `vet12345`  |
| 🏛️ Admin          | `admin@pashusakhi.in`  | `admin123`  |

### Login

Open:

```text
index.html
```

and select the appropriate role/demo account.

These accounts are intended to allow judges and developers to experience the complete prototype without creating new accounts.
