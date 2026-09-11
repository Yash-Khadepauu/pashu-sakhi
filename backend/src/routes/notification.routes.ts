import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);

router.get("/", NotificationController.listNotifications);
router.patch("/:id/read", NotificationController.markAsRead);

export default router;
