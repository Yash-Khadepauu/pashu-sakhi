import prisma from "../config/database";
import { AppError } from "../utils/apiError";
import { EmergencySeverity, EmergencyStatus } from "@prisma/client";

export class EmergencyService {
  static async createEmergency(
    farmerId: string,
    data: {
      animalId: string;
      symptoms: string;
      aiTriageResult?: string;
      severity?: "moderate" | "critical";
      is1962HelplineInbound?: boolean;
    }
  ) {
    const animal = await prisma.animal.findUnique({ where: { id: data.animalId } });
    if (!animal || animal.deletedAt) {
      throw new AppError("Animal record not found.", 404);
    }

    const id = `EMG-${Math.floor(1000 + Math.random() * 9000)}`;

    const emergency = await prisma.emergency.create({
      data: {
        id,
        animalId: data.animalId,
        farmerId,
        symptoms: data.symptoms.trim(),
        aiTriageResult: data.aiTriageResult || "Emergency SOS Triggered",
        severity: (data.severity as EmergencySeverity) || EmergencySeverity.critical,
        status: EmergencyStatus.new,
        is1962HelplineInbound: Boolean(data.is1962HelplineInbound),
      },
      include: {
        animal: { select: { id: true, name: true, species: true, breed: true } },
        farmer: { select: { id: true, name: true, mobile: true, villageLocation: true } },
      },
    });

    return emergency;
  }

  static async listEmergencies(user: { id: string; role: string }) {
    const whereClause: any = {};
    if (user.role === "farmer") {
      whereClause.farmerId = user.id;
    }

    const emergencies = await prisma.emergency.findMany({
      where: whereClause,
      include: {
        animal: { select: { id: true, name: true, species: true, breed: true, earTag: true } },
        farmer: { select: { id: true, name: true, mobile: true, villageLocation: true } },
        assignedVet: { select: { id: true, name: true, mobile: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return emergencies;
  }

  static async acceptEmergency(emergencyId: string, vetId: string) {
    const emergency = await prisma.emergency.findUnique({ where: { id: emergencyId } });
    if (!emergency) {
      throw new AppError("Emergency incident not found.", 404);
    }

    if (emergency.status !== EmergencyStatus.new) {
      throw new AppError(`Emergency already ${emergency.status}.`, 400);
    }

    const responseTimeSeconds = Math.round(
      (Date.now() - new Date(emergency.createdAt).getTime()) / 1000
    );

    const updated = await prisma.emergency.update({
      where: { id: emergencyId },
      data: {
        assignedVetId: vetId,
        status: EmergencyStatus.accepted,
        responseTimeSeconds,
      },
      include: {
        animal: true,
        farmer: { select: { name: true, mobile: true, villageLocation: true } },
        assignedVet: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  static async updateStatus(
    emergencyId: string,
    data: {
      status: "new" | "accepted" | "inTreatment" | "resolved";
      assignedVetId?: string;
    }
  ) {
    const emergency = await prisma.emergency.findUnique({ where: { id: emergencyId } });
    if (!emergency) {
      throw new AppError("Emergency incident not found.", 404);
    }

    const updates: any = {
      status: data.status as EmergencyStatus,
    };

    if (data.status === "resolved") {
      updates.resolvedAt = new Date();
    }

    if (data.assignedVetId) {
      updates.assignedVetId = data.assignedVetId;
    }

    const updated = await prisma.emergency.update({
      where: { id: emergencyId },
      data: updates,
      include: {
        animal: true,
        assignedVet: { select: { id: true, name: true } },
      },
    });

    return updated;
  }
}
