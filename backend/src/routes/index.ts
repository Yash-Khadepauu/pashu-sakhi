import { Router, Request, Response } from "express";
import { checkDatabaseConnection } from "../config/database";
import { sendSuccess } from "../utils/apiResponse";

import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import animalRoutes from "./animal.routes";
import consultationRoutes from "./consultation.routes";
import treatmentRoutes from "./treatment.routes";
import diagnosticRoutes from "./diagnostic.routes";
import emergencyRoutes from "./emergency.routes";
import notificationRoutes from "./notification.routes";
import hotspotRoutes from "./hotspot.routes";
import complaintRoutes from "./complaint.routes";

const rootRouter = Router();

// ---------------------------------------------------------------------------
// Health Check Endpoint (GET /api/health)
// ---------------------------------------------------------------------------
rootRouter.get("/health", async (req: Request, res: Response) => {
  const isDbConnected = await checkDatabaseConnection();
  return sendSuccess(
    res,
    {
      service: "backend",
      status: "healthy",
      database: isDbConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
    "PashuSakhi backend is running",
    200
  );
});

// ---------------------------------------------------------------------------
// API v1 Sub-Router (Mounted at /api/v1)
// ---------------------------------------------------------------------------
const v1Router = Router();

v1Router.use("/auth", authRoutes);
v1Router.use("/users", userRoutes);
v1Router.use("/animals", animalRoutes);
v1Router.use("/consultations", consultationRoutes);
v1Router.use("/treatments", treatmentRoutes);
v1Router.use("/diagnostics", diagnosticRoutes);
v1Router.use("/emergencies", emergencyRoutes);
v1Router.use("/notifications", notificationRoutes);
v1Router.use("/surveillance/hotspots", hotspotRoutes);
v1Router.use("/complaints", complaintRoutes);

// Direct admin complaint aliases matching specification (/api/v1/admin/complaints)
v1Router.use("/admin/complaints", complaintRoutes);

rootRouter.use("/v1", v1Router);

export default rootRouter;
