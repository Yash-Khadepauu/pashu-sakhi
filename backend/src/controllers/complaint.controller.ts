import { Request, Response, NextFunction } from "express";
import { ComplaintService } from "../services/complaint.service";
import { sendSuccess } from "../utils/apiResponse";

export class ComplaintController {
  static async submitComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const complaint = await ComplaintService.submitComplaint(req.user!.id, req.body);
      sendSuccess(res, { complaint }, "Complaint submitted successfully.", 201);
    } catch (error) {
      next(error);
    }
  }

  static async listComplaints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const complaints = await ComplaintService.listComplaints(req.user!);
      sendSuccess(res, { complaints, count: complaints.length }, "Complaints retrieved.");
    } catch (error) {
      next(error);
    }
  }

  static async updateComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await ComplaintService.updateComplaint(req.params.id, req.body);
      sendSuccess(res, { complaint: updated }, "Complaint updated.");
    } catch (error) {
      next(error);
    }
  }
}
