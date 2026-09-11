import { Request, Response, NextFunction } from "express";
import { AnimalService } from "../services/animal.service";
import { sendSuccess } from "../utils/apiResponse";

export class AnimalController {
  static async listAnimals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const animals = await AnimalService.listAnimals(req.user!);
      sendSuccess(res, { animals, count: animals.length }, "Animals retrieved successfully.");
    } catch (error) {
      next(error);
    }
  }

  static async createAnimal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const animal = await AnimalService.createAnimal(req.user!.id, req.body);
      sendSuccess(res, { animal }, "Animal registered successfully.", 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAnimalById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const animal = await AnimalService.getAnimalById(req.params.id, req.user!);
      sendSuccess(res, { animal }, "Animal details retrieved.");
    } catch (error) {
      next(error);
    }
  }

  static async updateAnimal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const animal = await AnimalService.updateAnimal(req.params.id, req.user!, req.body);
      sendSuccess(res, { animal }, "Animal updated successfully.");
    } catch (error) {
      next(error);
    }
  }

  static async deleteAnimal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AnimalService.deleteAnimal(req.params.id, req.user!);
      sendSuccess(res, result, "Animal removed successfully.");
    } catch (error) {
      next(error);
    }
  }

  static async getAnimalHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await AnimalService.getAnimalHistory(req.params.id, req.user!);
      sendSuccess(res, { history }, "Animal medical history retrieved.");
    } catch (error) {
      next(error);
    }
  }
}
