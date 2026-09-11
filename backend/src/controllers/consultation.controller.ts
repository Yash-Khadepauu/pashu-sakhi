import { Request, Response, NextFunction } from "express";
import { ConsultationService } from "../services/consultation.service";
import { sendSuccess } from "../utils/apiResponse";

export class ConsultationController {
  static async listConsultations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const consultations = await ConsultationService.listConsultations(req.user!);
      sendSuccess(res, { consultations, count: consultations.length }, "Consultations retrieved.");
    } catch (error) {
      next(error);
    }
  }

  static async createConsultation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const consultation = await ConsultationService.createConsultation(req.user!.id, req.body);
      sendSuccess(res, { consultation }, "Consultation request created.", 201);
    } catch (error) {
      next(error);
    }
  }

  static async getConsultationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const consultation = await ConsultationService.getConsultationById(req.params.id, req.user!);
      sendSuccess(res, { consultation }, "Consultation details retrieved.");
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await ConsultationService.updateStatus(req.params.id, req.user!, req.body);
      sendSuccess(res, { consultation: updated }, "Consultation status updated.");
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const message = await ConsultationService.sendMessage(req.params.id, req.user!, req.body);
      sendSuccess(res, { message }, "Message sent.", 201);
    } catch (error) {
      next(error);
    }
  }
}
