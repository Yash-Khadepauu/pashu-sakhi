import prisma from "../config/database";
import { AppError } from "../utils/apiError";
import { ConsultationStatus, PriorityLevel, Role } from "@prisma/client";

export class ConsultationService {
  static async listConsultations(user: { id: string; role: string }) {
    const whereClause: any = {};

    if (user.role === "farmer") {
      whereClause.farmerId = user.id;
    } else if (user.role === "veterinarian") {
      whereClause.OR = [
        { assignedVetId: user.id },
        { status: { in: [ConsultationStatus.new, ConsultationStatus.waiting] } },
      ];
    }

    return prisma.consultation.findMany({
      where: whereClause,
      include: {
        animal: { select: { id: true, name: true, species: true, breed: true } },
        farmer: { select: { id: true, name: true, mobile: true, villageLocation: true } },
        assignedVet: { select: { id: true, name: true, mobile: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createConsultation(
    farmerId: string,
    data: {
      animalId: string;
      symptomsSummary: string;
      imageUrl?: string;
      priority?: "low" | "moderate" | "high" | "critical";
      assignedVetId?: string;
    }
  ) {
    // Verify animal ownership
    const animal = await prisma.animal.findUnique({
      where: { id: data.animalId },
    });

    if (!animal || animal.deletedAt || animal.ownerId !== farmerId) {
      throw new AppError("Invalid animal ID or you do not own this animal.", 400);
    }

    const id = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;

    const consultation = await prisma.consultation.create({
      data: {
        id,
        farmerId,
        animalId: data.animalId,
        symptomsSummary: data.symptomsSummary,
        imageUrl: data.imageUrl,
        priority: (data.priority as PriorityLevel) || PriorityLevel.moderate,
        assignedVetId: data.assignedVetId,
        status: ConsultationStatus.new,
      },
      include: {
        animal: true,
        farmer: { select: { id: true, name: true, email: true } },
      },
    });

    return consultation;
  }

  static async getConsultationById(id: string, user: { id: string; role: string }) {
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: {
        animal: true,
        farmer: { select: { id: true, name: true, mobile: true, villageLocation: true } },
        assignedVet: { select: { id: true, name: true, mobile: true } },
        messages: {
          include: {
            sender: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!consultation) {
      throw new AppError("Consultation session not found.", 404);
    }

    if (user.role === "farmer" && consultation.farmerId !== user.id) {
      throw new AppError("Access denied to this consultation.", 403);
    }

    return consultation;
  }

  static async updateStatus(
    id: string,
    user: { id: string; role: string },
    data: {
      status: "new" | "unread" | "waiting" | "inConsultation" | "resolved";
      assignedVetId?: string;
    }
  ) {
    const consultation = await prisma.consultation.findUnique({ where: { id } });
    if (!consultation) {
      throw new AppError("Consultation not found.", 404);
    }

    const updates: any = {
      status: data.status as ConsultationStatus,
    };

    if (data.status === "resolved") {
      updates.resolvedAt = new Date();
    }

    if (user.role === "veterinarian") {
      updates.assignedVetId = user.id;
    } else if (data.assignedVetId) {
      updates.assignedVetId = data.assignedVetId;
    }

    const updated = await prisma.consultation.update({
      where: { id },
      data: updates,
      include: {
        animal: true,
        assignedVet: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  static async sendMessage(
    consultationId: string,
    user: { id: string; role: string },
    data: { messageText: string; category?: string }
  ) {
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new AppError("Consultation session not found.", 404);
    }

    if (user.role === "farmer" && consultation.farmerId !== user.id) {
      throw new AppError("Access denied.", 403);
    }

    const message = await prisma.chatMessage.create({
      data: {
        consultationId,
        senderId: user.id,
        senderRole: user.role as Role,
        messageText: data.messageText.trim(),
        category: data.category || "general",
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    return message;
  }
}
