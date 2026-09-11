import prisma from "../config/database";
import { AppError } from "../utils/apiError";

export class NotificationService {
  static async listNotifications(userId: string) {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      include: {
        animal: { select: { id: true, name: true, species: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return notifications;
  }

  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new AppError("Notification not found.", 404);
    }

    if (notification.recipientId !== userId) {
      throw new AppError("Access denied.", 403);
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return updated;
  }
}
