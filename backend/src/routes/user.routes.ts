import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticateToken } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { updateProfileSchema } from "../validators/user.validator";

const router = Router();

router.use(authenticateToken);
router.get("/profile", UserController.getProfile);
router.put("/profile", validateRequest(updateProfileSchema), UserController.updateProfile);

export default router;
