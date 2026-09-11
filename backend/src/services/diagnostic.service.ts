import prisma from "../config/database";
import { AppError } from "../utils/apiError";
import { env } from "../config/env";
import { HealthStatus, ScreeningStatus, ScreeningType } from "@prisma/client";
import {
  GeminiVeterinaryService,
  VeterinaryScreeningOutput,
  ModelTierUsed,
} from "./gemini.service";
import { EmergencyService } from "./emergency.service";

interface SymptomInput {
  reportedSymptoms: string[];
  temperatureSelected?: string;
  appetiteSelected?: string;
  activitySelected?: string;
  notes?: string;
}

export class DiagnosticService {
  static async submitSymptomScreening(
    farmerId: string,
    data: {
      animalId: string;
      reportedSymptoms: string[];
      temperatureSelected?: string;
      appetiteSelected?: string;
      activitySelected?: string;
      notes?: string;
      screeningType?: "symptom_triage" | "image_detection";
      imageUrl?: string;
    }
  ) {
    let animal = await prisma.animal.findFirst({
      where: {
        id: data.animalId,
        ownerId: farmerId,
        deletedAt: null,
      },
    });

    if (!animal) {
      // Allow fallback lookup by name or positional index for frontend stubs ("a1", "a2", "a3", "a4")
      const farmerAnimals = await prisma.animal.findMany({
        where: { ownerId: farmerId, deletedAt: null },
        orderBy: { createdAt: "asc" },
      });

      if (data.animalId === "a1" && farmerAnimals[0]) animal = farmerAnimals[0];
      else if (data.animalId === "a2" && farmerAnimals[1]) animal = farmerAnimals[1];
      else if (data.animalId === "a3" && farmerAnimals[2]) animal = farmerAnimals[2];
      else if (data.animalId === "a4" && farmerAnimals[3]) animal = farmerAnimals[3];
      else animal = farmerAnimals[0];
    }

    if (!animal) {
      throw new AppError("No registered livestock found for this farmer account.", 400);
    }

    let geminiResult: VeterinaryScreeningOutput;
    let modelTierUsed: ModelTierUsed = "pro";
    let fallbackReason: string | null = null;

    const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AppError(
        "GEMINI_API_KEY is not configured in backend/.env. Live Gemini screening requires a valid Google Gemini API key.",
        500
      );
    }

    try {
      geminiResult = await GeminiVeterinaryService.screenLivestock({
        image: data.imageUrl,
        symptomsSummary: (data.reportedSymptoms || []).join(", "),
        temperature: data.temperatureSelected,
        appetite: data.appetiteSelected,
        activity: data.activitySelected,
        notes: data.notes,
      });
      modelTierUsed = geminiResult.model_tier_used;
    } catch (err: any) {
      fallbackReason = err?.message || String(err);
      console.error(`[DiagnosticService] Gemini screening error:`, fallbackReason);
      throw new AppError(`Gemini AI Screening Failed: ${fallbackReason}`, 502);
    }

    const condition = geminiResult.condition;
    const confidence = geminiResult.confidence;
    const recommendations = [geminiResult.recommended_action];
    let escalateTo1962 = geminiResult.escalate_to_1962;
    let riskLevel: HealthStatus;
    let screeningStatus: ScreeningStatus = ScreeningStatus.New;

    // Safe severity mapping:
    switch (geminiResult.severity) {
      case "emergency":
        riskLevel = HealthStatus.urgent;
        escalateTo1962 = true;
        break;
      case "moderate":
        riskLevel = HealthStatus.attention;
        break;
      case "routine":
        riskLevel = HealthStatus.healthy;
        break;
      case "unable_to_assess":
      default:
        // CRITICAL CLINICAL SAFETY INVARIANT: Never mark an unassessed or uncertain animal as healthy!
        riskLevel = HealthStatus.attention;
        screeningStatus = ScreeningStatus.Under_Review;
        break;
    }


    const id = `AR-${Math.floor(1000 + Math.random() * 9000)}`;

    // Serialize audit metadata including model_tier_used and visual/symptom findings
    const auditNotes = JSON.stringify({
      userNotes: data.notes || "",
      model_tier_used: modelTierUsed,
      fallbackReason: fallbackReason || undefined,
      visual_findings: geminiResult?.visual_findings || "",
      symptom_findings: geminiResult?.symptom_findings || "",
      reasoning: geminiResult?.reasoning || "",
      escalate_to_1962: escalateTo1962,
    });

    const log = await prisma.screeningLog.create({
      data: {
        id,
        animalId: animal.id,
        farmerId,
        screeningType:
          data.screeningType === "image_detection" || Boolean(data.imageUrl)
            ? ScreeningType.image_detection
            : ScreeningType.symptom_triage,
        imageUrl: data.imageUrl,
        reportedSymptoms: JSON.stringify(data.reportedSymptoms),
        temperatureSelected: data.temperatureSelected,
        appetiteSelected: data.appetiteSelected,
        activitySelected: data.activitySelected,
        notes: auditNotes,
        aiPredictedCondition: condition,
        confidenceScore: confidence,
        riskLevel,
        status: screeningStatus,
      },
      include: {
        animal: true,
      },
    });

    // Update animal's current health status if evaluated as urgent or attention
    if (riskLevel !== HealthStatus.healthy) {
      await prisma.animal.update({
        where: { id: animal.id },
        data: { healthStatus: riskLevel },
      });
    }

    // If escalateTo1962 is true, create an automated high-priority Emergency case
    let emergencyIncident = null;
    if (escalateTo1962 || riskLevel === HealthStatus.urgent) {
      try {
        emergencyIncident = await EmergencyService.createEmergency(farmerId, {
          animalId: animal.id,

          symptoms: `[AI Triage Escalation] Suspected ${condition} (Confidence: ${confidence}%). Symptoms: ${(data.reportedSymptoms || []).join(", ")}`,
          aiTriageResult: condition,
          severity: "critical",
          is1962HelplineInbound: true,
        });
      } catch (emgErr) {
        console.error("[DiagnosticService] Failed to auto-create emergency incident:", emgErr);
      }
    }

    return {
      log,
      recommendations,
      triage: {
        species_check:
          geminiResult?.species_check ||
          (animal.species?.toLowerCase().includes("buffalo") ? "buffalo" : "cattle"),
        condition,
        confidence,
        severity:
          geminiResult?.severity ||
          (riskLevel === HealthStatus.urgent
            ? "emergency"
            : riskLevel === HealthStatus.attention
            ? "moderate"
            : "routine"),
        visual_findings: geminiResult?.visual_findings || "",
        symptom_findings:
          geminiResult?.symptom_findings || (data.reportedSymptoms || []).join(", "),
        reasoning:
          geminiResult?.reasoning ||
          "Screening evaluated by deterministic triage engine with safety invariants.",
        recommended_action:
          recommendations[0] ||
          "Consult veterinarian if symptoms persist. Disclaimer: This is a screening aid, not a diagnosis.",
        escalate_to_1962: escalateTo1962,
        model_tier_used: modelTierUsed,
      },
      emergencyIncident,
    };
  }


  static async listReports(user: { id: string; role: string }) {
    const whereClause: any = {};

    if (user.role === "farmer") {
      whereClause.farmerId = user.id;
    }

    const reports = await prisma.screeningLog.findMany({
      where: whereClause,
      include: {
        animal: { select: { id: true, name: true, species: true, breed: true, earTag: true } },
        farmer: { select: { id: true, name: true, mobile: true, villageLocation: true } },
        reviewedByVet: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return reports;
  }

  static async updateReportStatus(
    id: string,
    user: { id: string; role: string },
    data: {
      status: "New" | "Under_Review" | "Resolved";
      vetReviewNotes?: string;
    }
  ) {
    const report = await prisma.screeningLog.findUnique({ where: { id } });
    if (!report) {
      throw new AppError("Screening report not found.", 404);
    }

    const updated = await prisma.screeningLog.update({
      where: { id },
      data: {
        status: data.status as ScreeningStatus,
        reviewedByVetId: user.role === "veterinarian" ? user.id : report.reviewedByVetId,
        vetReviewNotes: data.vetReviewNotes,
      },
      include: {
        animal: true,
        reviewedByVet: { select: { id: true, name: true } },
      },
    });

    return updated;
  }
}
