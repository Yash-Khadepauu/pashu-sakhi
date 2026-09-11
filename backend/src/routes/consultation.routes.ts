import { Router } from "express";
import { ConsultationController } from "../controllers/consultation.controller";
import { authenticateToken, requireRole } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import {
  createConsultationSchema,
  updateConsultationStatusSchema,
  createChatMessageSchema,
} from "../validators/consultation.validator";

const router = Router();

router.use(authenticateToken);

router.get("/", ConsultationController.listConsultations);
router.post(
  "/",
  requireRole("farmer"),
  validateRequest(createConsultationSchema),
  ConsultationController.createConsultation
);
router.get("/:id", ConsultationController.getConsultationById);
router.patch(
  "/:id/status",
  requireRole("veterinarian", "admin"),
  validateRequest(updateConsultationStatusSchema),
  ConsultationController.updateStatus
);
router.post(
  "/:id/messages",
  validateRequest(createChatMessageSchema),
  ConsultationController.sendMessage
);

export default router;
