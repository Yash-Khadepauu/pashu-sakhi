# Implementation Plan: PashuSakhi Backend Foundation

Architect and implement the initial backend foundation for **PashuSakhi** (Smart Livestock Healthcare & Epidemiological Surveillance System) using **Node.js + TypeScript + Express + Prisma ORM + PostgreSQL**, with clean modular architecture, JWT authentication with Role-Based Access Control (RBAC), Zod validation, seeded demo data matching the existing frontend, and complete RESTful APIs.

---

## User Review Required

> [!IMPORTANT]
> - The existing frontend files (`index.html`, `Farmer (4).html`, `Vet_Fixed (2).html`, `PashuSakhi_Admin_Dashboard_Final.html`) will remain completely untouched and intact.
> - The backend will live in a dedicated `backend/` directory in the project root.
> - As per guidelines, this step builds the **foundation**: real ML/PyTorch, real-time WebSockets/Socket.io, and real 1962 helpline CAD integration are deliberately excluded from this phase and will be added in subsequent phases.
> - A rule-based deterministic classifier service will be used for symptom screening triage, isolated cleanly so real ML models can seamlessly plug in later.

---

## Proposed Architecture & File Structure

```
pashusakhi-project/
├── index.html                                        (Untouched)
├── Farmer (4).html                                   (Untouched)
├── Vet_Fixed (2).html                                (Untouched)
├── PashuSakhi_Admin_Dashboard_Final.html             (Untouched)
├── pashusakhi_backend_architecture_specification.md (Specification reference)
│
└── backend/
    ├── prisma/
    │   ├── schema.prisma            # 12 Prisma models & enums
    │   └── seed.ts                  # Seed script with demo accounts & mock data
    ├── src/
    │   ├── config/
    │   │   ├── env.ts               # Validated env configuration
    │   │   └── database.ts          # PrismaClient singleton instance
    │   ├── constants/
    │   │   └── roles.ts             # Role definitions & constants
    │   ├── types/
    │   │   ├── express.d.ts         # Augmented Request with AuthUser
    │   │   └── api.ts               # Standard API response interfaces
    │   ├── utils/
    │   │   ├── apiResponse.ts       # Success & error response formatters
    │   │   ├── apiError.ts          # Custom AppError class
    │   │   └── jwt.ts               # Token signing & verification helpers
    │   ├── middleware/
    │   │   ├── auth.ts              # authenticateToken & requireRole RBAC middleware
    │   │   ├── validate.ts          # Zod schema request validation middleware
    │   │   ├── errorHandler.ts      # Centralized error handler
    │   │   └── notFound.ts          # 404 handler
    │   ├── validators/
    │   │   ├── auth.validator.ts
    │   │   ├── animal.validator.ts
    │   │   ├── consultation.validator.ts
    │   │   ├── treatment.validator.ts
    │   │   ├── diagnostic.validator.ts
    │   │   ├── emergency.validator.ts
    │   │   └── complaint.validator.ts
    │   ├── services/
    │   │   ├── auth.service.ts
    │   │   ├── user.service.ts
    │   │   ├── animal.service.ts
    │   │   ├── consultation.service.ts
    │   │   ├── treatment.service.ts
    │   │   ├── diagnostic.service.ts # Rule-based triage classifier
    │   │   ├── emergency.service.ts
    │   │   ├── notification.service.ts
    │   │   ├── hotspot.service.ts
    │   │   └── complaint.service.ts
    │   ├── controllers/
    │   │   ├── auth.controller.ts
    │   │   ├── user.controller.ts
    │   │   ├── animal.controller.ts
    │   │   ├── consultation.controller.ts
    │   │   ├── treatment.controller.ts
    │   │   ├── diagnostic.controller.ts
    │   │   ├── emergency.controller.ts
    │   │   ├── notification.controller.ts
    │   │   ├── hotspot.controller.ts
    │   │   └── complaint.controller.ts
    │   ├── routes/
    │   │   ├── auth.routes.ts
    │   │   ├── user.routes.ts
    │   │   ├── animal.routes.ts
    │   │   ├── consultation.routes.ts
    │   │   ├── treatment.routes.ts
    │   │   ├── diagnostic.routes.ts
    │   │   ├── emergency.routes.ts
    │   │   ├── notification.routes.ts
    │   │   ├── hotspot.routes.ts
    │   │   ├── complaint.routes.ts
    │   │   └── index.ts             # Combines /api/v1 router & /api/health
    │   ├── app.ts                   # Express application setup with CORS & security
    │   └── server.ts                # Server startup & graceful shutdown
    ├── .env.example
    ├── .gitignore
    ├── tsconfig.json
    ├── package.json
    └── README.md                    # Complete setup, API reference & demo credentials
```

---

## Database Schema (Prisma Models)

1. **`User`**: Core user accounts (`farmer`, `veterinarian`, `admin`).
2. **`VetProfile`**: Professional licensing (`registrationNumber`, `clinicAffiliation`, `serviceArea`, `availability`, `verifiedLicense`).
3. **`Animal`**: Livestock registry (`ownerId`, `earTag`, `name`, `species`, `breed`, `ageYears`, `gender`, `healthStatus`, `deletedAt` for soft deletes).
4. **`Vaccination`**: Immunization tracker (`animalId`, `vaccineName`, `dueDate`, `completedDate`, `status`).
5. **`Treatment`**: Medical ledger (`animalId`, `prescribedById`, `conditionDiagnosed`, `medicinePrescribed`, `dosage`, `route`, `duration`, `status`).
6. **`Consultation`**: Telemedicine triage (`id` formatted e.g. `REQ-2041`, `farmerId`, `animalId`, `assignedVetId`, `symptomsSummary`, `priority`, `status`: `new` → `waiting` → `inConsultation` → `resolved`).
7. **`ChatMessage`**: Messages within consultation (`consultationId`, `senderId`, `senderRole`, `messageText`, `category`).
8. **`ScreeningLog`**: AI symptom triage and image audit log (`id` e.g. `AR-3311`, `animalId`, `farmerId`, `reportedSymptoms`, `aiPredictedCondition`, `confidenceScore`, `riskLevel`, `status`).
9. **`Emergency`**: Acute emergencies (`id` e.g. `EMG-0512`, `animalId`, `farmerId`, `assignedVetId`, `symptoms`, `severity`, `status`, `is1962HelplineInbound`).
10. **`OutbreakHotspot`**: Disease surveillance clusters (`district`, `diseaseName`, `riskLevel`, `latitude`, `longitude`, `mapX`, `mapY`, `affectedAnimalsCount`).
11. **`Complaint`**: Citizen grievance ticketing (`submittedById`, `assignedToId`, `category`, `status`, `description`).
12. **`Notification`**: System reminders & alerts (`recipientId`, `recipientRole`, `category`, `title`, `message`, `read`).

---

## Seed Data & Demo Accounts

All demo accounts will be seeded with bcrypt-hashed passwords:
- **Farmer**: `farmer@pashusakhi.in` / `farmer123` (Suresh Patil)
- **Veterinarian**: `vet@pashusakhi.in` / `vet12345` (Dr. Aditi Kulkarni, verified license)
- **Admin**: `admin@pashusakhi.in` / `admin123` (Super Admin)
- **Livestock**: Gauri, Raju, Lakshmi, Moti (matching `Farmer (4).html` initial animals).
- **Representative Data**: Associated vaccinations, treatments, screening logs, emergency cases, and outbreak hotspots.

---

## API Endpoints (Prefix `/api/v1` & `/api/health`)

| Group | Method & Path | Access Control | Description |
|---|---|---|---|
| **Health** | `GET /api/health` | Public | System status and service health |
| **Auth** | `POST /api/v1/auth/register` | Public | Register new user with validated role |
| | `POST /api/v1/auth/login` | Public | Authenticate user & issue signed JWT |
| | `GET /api/v1/auth/me` | Authenticated | Current user profile from JWT session |
| **Users** | `GET /api/v1/users/profile` | Authenticated | Retrieve current user profile |
| | `PUT /api/v1/users/profile` | Authenticated | Update user profile (name, mobile, language) |
| **Animals** | `GET /api/v1/animals` | Farmer / Vet / Admin | List animals (Farmers only see owned animals) |
| | `POST /api/v1/animals` | Farmer | Register new livestock record |
| | `GET /api/v1/animals/:id` | Authenticated | View animal with vaccination & treatment history |
| | `PUT /api/v1/animals/:id` | Farmer / Admin | Update animal details (owner check enforced) |
| | `DELETE /api/v1/animals/:id` | Farmer / Admin | Soft delete animal (`deletedAt` timestamp) |
| | `GET /api/v1/animals/:id/history` | Authenticated | Chronological medical and screening history |
| **Consultations** | `GET /api/v1/consultations` | Authenticated | List consultations (filtered by role/owner/assigned vet) |
| | `POST /api/v1/consultations` | Farmer | Create new consultation request |
| | `GET /api/v1/consultations/:id` | Authenticated | Get consultation details and messages |
| | `PATCH /api/v1/consultations/:id/status` | Vet / Admin | Transition status (`waiting`, `inConsultation`, `resolved`) |
| **Treatments** | `POST /api/v1/treatments` | Veterinarian | Record new clinical treatment / prescription |
| | `GET /api/v1/treatments/active` | Authenticated | Get active treatments for owned or assigned animals |
| | `PATCH /api/v1/treatments/:id` | Veterinarian | Update treatment course or mark completed |
| **Diagnostics** | `POST /api/v1/diagnostics/symptoms` | Farmer | Rule-based symptom triage classifier & log |
| | `GET /api/v1/diagnostics/reports` | Authenticated | List screening reports (vet triage queue / farmer logs) |
| | `PATCH /api/v1/diagnostics/reports/:id/status` | Vet / Admin | Vet review & confirmation of screening result |
| **Emergencies** | `POST /api/v1/emergencies` | Farmer / Admin | Trigger emergency SOS incident (supports 1962 inbound) |
| | `GET /api/v1/emergencies` | Vet / Admin | Triage emergency cases |
| | `POST /api/v1/emergencies/:id/accept` | Veterinarian | Vet claims/accepts emergency incident |
| | `PATCH /api/v1/emergencies/:id/status` | Vet / Admin | Update emergency status (`inTreatment`, `resolved`) |
| **Notifications** | `GET /api/v1/notifications` | Authenticated | Get recipient notifications |
| | `PATCH /api/v1/notifications/:id/read` | Authenticated | Mark notification as read |
| **Surveillance** | `GET /api/v1/surveillance/hotspots` | Vet / Admin | List pre-seeded disease outbreak clusters |
| | `GET /api/v1/surveillance/hotspots/:id` | Vet / Admin | Hotspot details, affected farms & advisory |
| **Complaints** | `POST /api/v1/complaints` | Authenticated | Submit grievance ticket |
| | `GET /api/v1/admin/complaints` | Admin | List global platform complaints |
| | `PATCH /api/v1/admin/complaints/:id` | Admin | Assign or resolve complaint ticket |

---

## Verification Plan

### Automated / Programmatic Tests
1. **Package & TypeScript Compilation**:
   - `npm run build`: verifies clean TypeScript compilation with zero type errors.
2. **Prisma Generation & Migration**:
   - `npm run prisma:generate`: builds Prisma client.
   - Database migration and seed: `npm run prisma:seed` loads demo users and animals.
3. **API Integration Test Script (`test_backend.ts`)**:
   - Tests `GET /api/health` returns status healthy.
   - Tests authentication: Farmer login, Vet login, Admin login.
   - Tests `/api/v1/auth/me` with JWT header.
   - Tests RBAC & Ownership: Farmer can create animal; Farmer B cannot access Farmer A's animal.
   - Tests Vet treatment creation.
   - Tests Diagnostics rule-based classifier endpoint.
   - Tests Emergency creation and acceptance workflow.
   - Tests Notification retrieval and read status.
   - Tests Admin endpoints reject non-admin users (HTTP 403).
