import { Request, Response, NextFunction } from "express";
import { EmergencyService } from "../services/emergency.service";
import { sendSuccess } from "../utils/apiResponse";

export class EmergencyController {
  static async createEmergency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const emergency = await EmergencyService.createEmergency(req.user!.id, req.body);
      sendSuccess(res, { emergency }, "Emergency incident recorded.", 201);
    } catch (error) {
      next(error);
    }
  }

  static async listEmergencies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const emergencies = await EmergencyService.listEmergencies(req.user!);
      sendSuccess(res, { emergencies, count: emergencies.length }, "Emergency cases retrieved.");
    } catch (error) {
      next(error);
    }
  }

  static async acceptEmergency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await EmergencyService.acceptEmergency(req.params.id, req.user!.id);
      sendSuccess(res, { emergency: updated }, "Emergency case accepted.");
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await EmergencyService.updateStatus(req.params.id, req.body);
      sendSuccess(res, { emergency: updated }, "Emergency status updated.");
    } catch (error) {
      next(error);
    }
  }
}
