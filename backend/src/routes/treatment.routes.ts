import { Router } from "express";
import { TreatmentController } from "../controllers/treatment.controller";
import { authenticateToken, requireRole } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { createTreatmentSchema, updateTreatmentSchema } from "../validators/treatment.validator";

const router = Router();

router.use(authenticateToken);

router.get("/active", TreatmentController.getActiveTreatments);
router.post(
  "/",
  requireRole("veterinarian"),
  validateRequest(createTreatmentSchema),
  TreatmentController.createTreatment
);
router.patch(
  "/:id",
  requireRole("veterinarian"),
  validateRequest(updateTreatmentSchema),
  TreatmentController.updateTreatment
);

export default router;
