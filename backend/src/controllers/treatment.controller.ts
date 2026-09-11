import { Request, Response, NextFunction } from "express";
import { TreatmentService } from "../services/treatment.service";
import { sendSuccess } from "../utils/apiResponse";

export class TreatmentController {
  static async createTreatment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const treatment = await TreatmentService.createTreatment(req.user!.id, req.body);
      sendSuccess(res, { treatment }, "Treatment recorded successfully.", 201);
    } catch (error) {
      next(error);
    }
  }

  static async getActiveTreatments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const treatments = await TreatmentService.getActiveTreatments(req.user!);
      sendSuccess(res, { treatments, count: treatments.length }, "Active treatments retrieved.");
    } catch (error) {
      next(error);
    }
  }

  static async updateTreatment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await TreatmentService.updateTreatment(req.params.id, req.user!, req.body);
      sendSuccess(res, { treatment: updated }, "Treatment updated successfully.");
    } catch (error) {
      next(error);
    }
  }
}
