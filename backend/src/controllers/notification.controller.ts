import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service";
import { sendSuccess } from "../utils/apiResponse";

export class NotificationController {
  static async listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notifications = await NotificationService.listNotifications(req.user!.id);
      sendSuccess(res, { notifications, count: notifications.length }, "Notifications retrieved.");
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notification = await NotificationService.markAsRead(req.params.id, req.user!.id);
      sendSuccess(res, { notification }, "Notification marked as read.");
    } catch (error) {
      next(error);
    }
  }
}
