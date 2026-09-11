import { Request, Response, NextFunction } from "express";
import { DiagnosticService } from "../services/diagnostic.service";
import { sendSuccess } from "../utils/apiResponse";

export class DiagnosticController {
  static async submitSymptomScreening(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await DiagnosticService.submitSymptomScreening(req.user!.id, req.body);
      sendSuccess(res, result, "Symptom screening evaluated.", 201);
    } catch (error) {
      next(error);
    }
  }

  static async listReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reports = await DiagnosticService.listReports(req.user!);
      sendSuccess(res, { reports, count: reports.length }, "Screening reports retrieved.");
    } catch (error) {
      next(error);
    }
  }

  static async updateReportStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const updated = await DiagnosticService.updateReportStatus(
        req.params.id,
        req.user!,
        req.body
      );
      sendSuccess(res, { report: updated }, "Screening report status updated.");
    } catch (error) {
      next(error);
    }
  }
}
