import prisma from "../config/database";
import { AppError } from "../utils/apiError";
import { AnimalGender, HealthStatus, VaccinationStatus } from "@prisma/client";

export class AnimalService {
  static async listAnimals(user: { id: string; role: string }) {
    const whereClause: any = { deletedAt: null };

    // Farmer only sees their own animals
    if (user.role === "farmer") {
      whereClause.ownerId = user.id;
    }

    const animals = await prisma.animal.findMany({
      where: whereClause,
      include: {
        vaccinations: {
          orderBy: { dueDate: "asc" },
          take: 1,
        },
        treatments: {
          where: { status: "active" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return animals;
  }

  static async createAnimal(
    ownerId: string,
    data: {
      name: string;
      species: string;
      breed: string;
      ageYears: number;
      gender: "Female" | "Male";
      earTag?: string;
      healthStatus?: "healthy" | "attention" | "urgent";
      vaccinationName?: string;
      vaccinationDueDate?: string;
    }
  ) {
    const animal = await prisma.animal.create({
      data: {
        ownerId,
        name: data.name.trim(),
        species: data.species.trim(),
        breed: data.breed?.trim() || "Indigenous",
        ageYears: data.ageYears,
        gender: data.gender as AnimalGender,
        earTag: data.earTag?.trim() || `TAG-${Math.floor(1000 + Math.random() * 9000)}`,
        healthStatus: (data.healthStatus as HealthStatus) || HealthStatus.healthy,
      },
    });

    // Optionally create upcoming vaccination if provided
    if (data.vaccinationName) {
      const dueDate = data.vaccinationDueDate
        ? new Date(data.vaccinationDueDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.vaccination.create({
        data: {
          animalId: animal.id,
          vaccineName: data.vaccinationName.trim(),
          dueDate,
          status: VaccinationStatus.due,
        },
      });
    }

    return animal;
  }

  static async getAnimalById(animalId: string, user: { id: string; role: string }) {
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, mobile: true, villageLocation: true },
        },
        vaccinations: {
          orderBy: { dueDate: "desc" },
        },
        treatments: {
          include: {
            prescribedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { startDate: "desc" },
        },
        screeningLogs: {
          orderBy: { createdAt: "desc" },
        },
        consultations: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!animal || animal.deletedAt) {
      throw new AppError("Animal record not found.", 404);
    }

    // Ownership check: Farmers can only access their own animals
    if (user.role === "farmer" && animal.ownerId !== user.id) {
      throw new AppError("Access denied: You do not own this animal.", 403);
    }

    return animal;
  }

  static async updateAnimal(
    animalId: string,
    user: { id: string; role: string },
    data: {
      name?: string;
      species?: string;
      breed?: string;
      ageYears?: number;
      gender?: "Female" | "Male";
      earTag?: string;
      healthStatus?: "healthy" | "attention" | "urgent";
    }
  ) {
    const existing = await prisma.animal.findUnique({ where: { id: animalId } });
    if (!existing || existing.deletedAt) {
      throw new AppError("Animal record not found.", 404);
    }

    if (user.role === "farmer" && existing.ownerId !== user.id) {
      throw new AppError("Access denied: You do not own this animal.", 403);
    }

    const updated = await prisma.animal.update({
      where: { id: animalId },
      data: {
        name: data.name,
        species: data.species,
        breed: data.breed,
        ageYears: data.ageYears,
        gender: data.gender as AnimalGender,
        earTag: data.earTag,
        healthStatus: data.healthStatus as HealthStatus,
      },
    });

    return updated;
  }

  static async deleteAnimal(animalId: string, user: { id: string; role: string }) {
    const existing = await prisma.animal.findUnique({ where: { id: animalId } });
    if (!existing || existing.deletedAt) {
      throw new AppError("Animal record not found.", 404);
    }

    if (user.role === "farmer" && existing.ownerId !== user.id) {
      throw new AppError("Access denied: You cannot delete an animal you do not own.", 403);
    }

    // Soft delete
    await prisma.animal.update({
      where: { id: animalId },
      data: { deletedAt: new Date() },
    });

    return { message: `Animal '${existing.name}' was successfully removed.` };
  }

  static async getAnimalHistory(animalId: string, user: { id: string; role: string }) {
    await this.getAnimalById(animalId, user); // verifies ownership & existence

    const [vaccinations, treatments, screenings] = await Promise.all([
      prisma.vaccination.findMany({
        where: { animalId },
        orderBy: { dueDate: "desc" },
      }),
      prisma.treatment.findMany({
        where: { animalId },
        include: { prescribedBy: { select: { name: true } } },
        orderBy: { startDate: "desc" },
      }),
      prisma.screeningLog.findMany({
        where: { animalId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Build unified chronological timeline
    const timeline: any[] = [];

    vaccinations.forEach((v) => {
      timeline.push({
        id: v.id,
        type: "vaccination",
        date: v.completedDate || v.dueDate,
        label: `Vaccination (${v.status})`,
        detail: `${v.vaccineName} - ${v.status === "completed" ? "Completed" : "Scheduled"}`,
      });
    });

    treatments.forEach((t) => {
      timeline.push({
        id: t.id,
        type: "treatment",
        date: t.startDate,
        label: `Treatment: ${t.conditionDiagnosed}`,
        detail: `${t.medicinePrescribed || "Medication prescribed"} (${t.status})`,
      });
    });

    screenings.forEach((s) => {
      timeline.push({
        id: s.id,
        type: "screening",
        date: s.createdAt,
        label: `Screening: ${s.aiPredictedCondition}`,
        detail: `Confidence: ${s.confidenceScore}% - Severity: ${s.riskLevel}`,
      });
    });

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return timeline;
  }
}
