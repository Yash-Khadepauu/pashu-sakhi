import prisma from "../config/database";
import { AppError } from "../utils/apiError";
import { TreatmentStatus } from "@prisma/client";

export class TreatmentService {
  static async createTreatment(
    prescribedById: string,
    data: {
      animalId: string;
      conditionDiagnosed: string;
      medicinePrescribed?: string;
      dosage?: string;
      route?: string;
      duration?: string;
      clinicalNotes?: string;
      startDate?: string;
      followUpDate?: string;
    }
  ) {
    const animal = await prisma.animal.findUnique({
      where: { id: data.animalId },
    });

    if (!animal || animal.deletedAt) {
      throw new AppError("Animal record not found.", 404);
    }

    const treatment = await prisma.treatment.create({
      data: {
        animalId: data.animalId,
        prescribedById,
        conditionDiagnosed: data.conditionDiagnosed.trim(),
        medicinePrescribed: data.medicinePrescribed?.trim(),
        dosage: data.dosage?.trim(),
        route: data.route?.trim(),
        duration: data.duration?.trim(),
        clinicalNotes: data.clinicalNotes?.trim(),
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        status: TreatmentStatus.active,
      },
      include: {
        animal: { select: { id: true, name: true, species: true, ownerId: true } },
        prescribedBy: { select: { id: true, name: true } },
      },
    });

    return treatment;
  }

  static async getActiveTreatments(user: { id: string; role: string }) {
    const whereClause: any = {
      status: TreatmentStatus.active,
    };

    if (user.role === "farmer") {
      whereClause.animal = { ownerId: user.id };
    }

    const treatments = await prisma.treatment.findMany({
      where: whereClause,
      include: {
        animal: { select: { id: true, name: true, species: true, breed: true, earTag: true } },
        prescribedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { startDate: "desc" },
    });

    return treatments;
  }

  static async updateTreatment(
    treatmentId: string,
    user: { id: string; role: string },
    data: {
      conditionDiagnosed?: string;
      medicinePrescribed?: string;
      dosage?: string;
      route?: string;
      duration?: string;
      clinicalNotes?: string;
      followUpDate?: string;
      status?: "active" | "completed" | "discontinued";
    }
  ) {
    const treatment = await prisma.treatment.findUnique({ where: { id: treatmentId } });
    if (!treatment) {
      throw new AppError("Treatment record not found.", 404);
    }

    const updated = await prisma.treatment.update({
      where: { id: treatmentId },
      data: {
        conditionDiagnosed: data.conditionDiagnosed,
        medicinePrescribed: data.medicinePrescribed,
        dosage: data.dosage,
        route: data.route,
        duration: data.duration,
        clinicalNotes: data.clinicalNotes,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        status: data.status ? (data.status as TreatmentStatus) : undefined,
      },
      include: {
        animal: true,
        prescribedBy: { select: { id: true, name: true } },
      },
    });

    return updated;
  }
}
