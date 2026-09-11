import { Router } from "express";
import { EmergencyController } from "../controllers/emergency.controller";
import { authenticateToken, requireRole } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import {
  createEmergencySchema,
  updateEmergencyStatusSchema,
} from "../validators/emergency.validator";

const router = Router();

router.use(authenticateToken);

router.get("/", EmergencyController.listEmergencies);
router.post(
  "/",
  requireRole("farmer", "admin"),
  validateRequest(createEmergencySchema),
  EmergencyController.createEmergency
);
router.post(
  "/:id/accept",
  requireRole("veterinarian"),
  EmergencyController.acceptEmergency
);
router.patch(
  "/:id/status",
  requireRole("veterinarian", "admin"),
  validateRequest(updateEmergencyStatusSchema),
  EmergencyController.updateStatus
);

export default router;
