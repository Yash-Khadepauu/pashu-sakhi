# 🐾 PashuSakhi Backend Foundation

The unified, production-ready backend engine for **PashuSakhi** — a digital livestock healthcare, telemedicine, and epidemiological surveillance ecosystem engineered for rural animal husbandry.

---

## 🚀 Tech Stack

- **Runtime:** Node.js (v18+)
- **Language:** TypeScript (v5+)
- **Web Framework:** Express.js (v4.21+)
- **Database ORM:** Prisma ORM (v6+)
- **Database:** PostgreSQL (with Relational Integrity & Soft Deletes)
- **Authentication:** JWT (JSON Web Tokens) with signed Role-Based Access Control (RBAC)
- **Password Security:** `bcrypt` (Salt rounds = 10)
- **Input Validation:** Zod Schema Validation Middleware
- **Cross-Origin Security:** CORS Middleware

---

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # 12 relational models & 14 enums
│   └── seed.ts                # Seed script with demo accounts & mock datasets
├── src/
│   ├── config/
│   │   ├── env.ts             # Validated environment configuration
│   │   └── database.ts        # PrismaClient singleton & connectivity checker
│   ├── constants/
│   │   └── roles.ts           # User roles (farmer, veterinarian, admin)
│   ├── types/
│   │   ├── api.ts             # Standard API response interfaces
│   │   └── express.d.ts       # Express Request augmentation (AuthUser)
│   ├── utils/
│   │   ├── apiResponse.ts     # sendSuccess & sendError formatters
│   │   ├── apiError.ts        # AppError custom exception class
│   │   └── jwt.ts             # Token signing & verification
│   ├── middleware/
│   │   ├── auth.ts            # authenticateToken & requireRole RBAC
│   │   ├── validate.ts        # Zod schema request validator
│   │   ├── errorHandler.ts    # Centralized error handler (Prisma + AppError)
│   │   └── notFound.ts        # 404 Route handler
│   ├── validators/            # Zod validation schemas for all resources
│   ├── services/              # Business logic & rule-based triage classifier
│   ├── controllers/           # HTTP request/response handlers
│   ├── routes/                # Modular Express routers & /api/v1 prefix
│   ├── app.ts                 # Express application configuration
│   └── server.ts              # Server startup & graceful shutdown
├── .env.example
├── .gitignore
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🔑 Demo Accounts (Pre-Seeded)

All passwords are automatically hashed with `bcrypt`:

| Role | Name | Email | Password | Details |
|---|---|---|---|---|
| **Farmer** | Suresh Patil | `farmer@pashusakhi.in` | `farmer123` | Pune District, owns Gauri, Raju, Lakshmi, Moti |
| **Veterinarian** | Dr. Aditi Kulkarni | `vet@pashusakhi.in` | `vet12345` | License `MH-VET-20394` (Verified), Nashik Zonal Center |
| **Admin** | Super Admin | `admin@pashusakhi.in` | `admin123` | Platform-wide oversight & outbreak surveillance |

---

## 🛠️ Setup & Installation

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** instance running locally or via cloud (Neon / Supabase / AWS RDS / Docker)

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` to point to your PostgreSQL database:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/pashusakhi?schema=public"
JWT_SECRET="pashusakhi_dev_jwt_secret_key_84920492840284028"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="*"
```

### 4. Database Setup & Migrations
Generate the Prisma Client:
```bash
npm run prisma:generate
```
Push the schema to PostgreSQL:
```bash
npm run prisma:push
# or run full migration:
# npm run prisma:migrate
```

### 5. Seed Demo Data
Populate the database with demo users, livestock, consultations, treatments, emergencies, and outbreak hotspots:
```bash
npm run prisma:seed
```

### 6. Run the Server
**Development Mode (Hot Reload with `tsx`):**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm run start
```

---

## 📡 API Reference & Endpoints

All API endpoints return a unified response schema:

**Success Structure:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully.",
  "data": {},
  "error": null
}
```

**Error Structure:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "data": null,
  "error": { "fields": [...] }
}
```

### 1. System Health
- `GET /api/health` — Returns backend uptime, service status, and PostgreSQL connectivity.

### 2. Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` — Register a new farmer, veterinarian, or admin.
- `POST /api/v1/auth/login` — Sign in and receive JWT token + user profile.
- `GET /api/v1/auth/me` — Inspect currently authenticated user session.

### 3. User & Profile (`/api/v1/users`)
- `GET /api/v1/users/profile` — View current user's profile details.
- `PUT /api/v1/users/profile` — Update name, phone, language preference, theme settings.

### 4. Animals / Livestock (`/api/v1/animals`)
- `GET /api/v1/animals` — List animals (Farmers only see owned animals; Vets/Admins see all).
- `POST /api/v1/animals` — Register new animal (Species: Cow, Buffalo, Goat, Sheep, Chicken).
- `GET /api/v1/animals/:id` — View animal profile with full vaccination and treatment records.
- `PUT /api/v1/animals/:id` — Update animal details (Owner check enforced).
- `DELETE /api/v1/animals/:id` — Soft-delete animal (`deletedAt` preserved for historical audits).
- `GET /api/v1/animals/:id/history` — Chronological clinical, vaccination, and screening timeline.

### 5. Telemedicine Consultations (`/api/v1/consultations`)
- `GET /api/v1/consultations` — List consultations (filtered by role / ownership / assignment).
- `POST /api/v1/consultations` — Request a new vet consultation.
- `GET /api/v1/consultations/:id` — View consultation thread and chat history.
- `PATCH /api/v1/consultations/:id/status` — Transition status (`waiting` → `inConsultation` → `resolved`).
- `POST /api/v1/consultations/:id/messages` — Send a message in a consultation thread.

### 6. Clinical Treatments (`/api/v1/treatments`)
- `GET /api/v1/treatments/active` — List active medical treatments and follow-up schedules.
- `POST /api/v1/treatments` — Record clinical treatment (Vet only: condition, drug, dosage, route, duration).
- `PATCH /api/v1/treatments/:id` — Update treatment notes or mark completed.

### 7. AI Diagnostic Screening (`/api/v1/diagnostics`)
- `POST /api/v1/diagnostics/symptoms` — Rule-based triage classifier (evaluates symptoms, returns predicted condition, confidence %, and health risk).
- `GET /api/v1/diagnostics/reports` — List screening logs for vet review and farmer records.
- `PATCH /api/v1/diagnostics/reports/:id/status` — Vet reviews and confirms or notes on triage report.

### 8. Emergency Cases (`/api/v1/emergencies`)
- `GET /api/v1/emergencies` — List emergency cases.
- `POST /api/v1/emergencies` — Trigger SOS incident (supports `is1962HelplineInbound`).
- `POST /api/v1/emergencies/:id/accept` — Vet accepts emergency case (calculates response time).
- `PATCH /api/v1/emergencies/:id/status` — Update emergency status (`inTreatment`, `resolved`).

### 9. Notifications (`/api/v1/notifications`)
- `GET /api/v1/notifications` — Get current user's unread notifications.
- `PATCH /api/v1/notifications/:id/read` — Mark notification as read.

### 10. Disease Outbreak Surveillance (`/api/v1/surveillance/hotspots`)
- `GET /api/v1/surveillance/hotspots` — List pre-seeded disease hotspots (LSD, FMD, HS, PPR).
- `GET /api/v1/surveillance/hotspots/:id` — Details on affected animals, farms, and advisories.

### 11. Complaints (`/api/v1/complaints`)
- `POST /api/v1/complaints` — Submit a grievance / complaint.
- `GET /api/v1/admin/complaints` — List complaints (Admin only).
- `PATCH /api/v1/admin/complaints/:id` — Assign or resolve complaint (Admin only).

---

## 🔌 How Frontend Connects to this Backend (Next Phase)

The existing frontend currently stores mock data in browser `localStorage`. In the next phase, connecting frontend to backend requires:
1. **API Client Helper**: Create an `api.js` helper in the frontend that attaches `Authorization: Bearer <token>` from `localStorage.getItem('psk_token')`.
2. **Authentication Flow**: Update `index.html` sign-in and sign-up form submits to call `POST /api/v1/auth/login` and store the returned token and role.
3. **Data Hydration**:
   - In `Farmer (4).html`: replace static `initialAnimals` with `GET /api/v1/animals`, and `AddAnimalModal` submit with `POST /api/v1/animals`.
   - In `Vet_Fixed (2).html`: fetch chat requests from `GET /api/v1/consultations` and emergency cases from `GET /api/v1/emergencies`.
   - In `PashuSakhi_Admin_Dashboard_Final.html`: fetch complaints from `GET /api/v1/admin/complaints` and hotspots from `GET /api/v1/surveillance/hotspots`.
