import { Router } from "express";
import { HotspotController } from "../controllers/hotspot.controller";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);
router.use(requireRole("veterinarian", "admin"));

router.get("/", HotspotController.listHotspots);
router.get("/:id", HotspotController.getHotspotById);

export default router;
