import { Router } from "express";
import { DiagnosticController } from "../controllers/diagnostic.controller";
import { authenticateToken, requireRole } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import {
  symptomScreeningSchema,
  updateReportStatusSchema,
} from "../validators/diagnostic.validator";

const router = Router();

router.use(authenticateToken);

router.post(
  "/symptoms",
  requireRole("farmer", "admin"),
  validateRequest(symptomScreeningSchema),
  DiagnosticController.submitSymptomScreening
);
router.get("/reports", DiagnosticController.listReports);
router.patch(
  "/reports/:id/status",
  requireRole("veterinarian", "admin"),
  validateRequest(updateReportStatusSchema),
  DiagnosticController.updateReportStatus
);

export default router;
