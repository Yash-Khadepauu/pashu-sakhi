import { Router } from "express";
import { ComplaintController } from "../controllers/complaint.controller";
import { authenticateToken, requireRole } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { createComplaintSchema, updateComplaintSchema } from "../validators/complaint.validator";

const router = Router();

router.use(authenticateToken);

// User submission
router.post("/", validateRequest(createComplaintSchema), ComplaintController.submitComplaint);

// Admin complaint management
router.get("/admin", requireRole("admin"), ComplaintController.listComplaints);
router.patch(
  "/admin/:id",
  requireRole("admin"),
  validateRequest(updateComplaintSchema),
  ComplaintController.updateComplaint
);

export default router;
