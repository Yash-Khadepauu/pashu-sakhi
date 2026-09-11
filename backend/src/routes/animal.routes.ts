import { Router } from "express";
import { AnimalController } from "../controllers/animal.controller";
import { authenticateToken, requireRole } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { createAnimalSchema, updateAnimalSchema } from "../validators/animal.validator";

const router = Router();

router.use(authenticateToken);

router.get("/", AnimalController.listAnimals);
router.post(
  "/",
  requireRole("farmer", "admin"),
  validateRequest(createAnimalSchema),
  AnimalController.createAnimal
);
router.get("/:id", AnimalController.getAnimalById);
router.put("/:id", validateRequest(updateAnimalSchema), AnimalController.updateAnimal);
router.delete("/:id", AnimalController.deleteAnimal);
router.get("/:id/history", AnimalController.getAnimalHistory);

export default router;
