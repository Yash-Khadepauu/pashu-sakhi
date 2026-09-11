import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validate";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/register", validateRequest(registerSchema), AuthController.register);
router.post("/login", validateRequest(loginSchema), AuthController.login);
router.get("/me", authenticateToken, AuthController.getCurrentUser);

export default router;
