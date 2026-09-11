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

interface DiagnosticResult { condition: string; confidence: number; riskLevel: HealthStatus; recommendations: string[]; }

export class DiagnosticService {
public static evaluateSymptoms(input: SymptomInput): DiagnosticResult {
    const s = input.reportedSymptoms.map((x) => x.toLowerCase());
    const temp = (input.temperatureSelected || "").toLowerCase();
    const appetite = (input.appetiteSelected || "").toLowerCase();
    const notes = (input.notes || "").toLowerCase();

    // 1. Critical Emergency Patterns (Colic, Bloat, High Pyrexia)
    if (
      s.includes("sym_bloat") ||
      s.includes("sym_colic") ||
      notes.includes("bloat") ||
      notes.includes("colic") ||
      notes.includes("choke")
    ) {
      return {
        condition: "Acute Ruminal Tympany / Severe Bloat",
        confidence: 89,
        riskLevel: HealthStatus.urgent,
        recommendations: [
          "Do not allow the animal to lie down.",
          "Keep the head elevated and remove all fermentable green fodder.",
          "Contact veterinarian immediately or call 1962 Pashu Sanjivini.",
        ],
      };
    }

    // 2. High Fever / Pyrexia & Infection
    if (
      s.includes("sym_fever") ||
      temp.includes("high") ||
      temp.includes("103") ||
      temp.includes("104") ||
      s.includes("sym_nasaldischarge")
    ) {
      return {
        condition: "Bovine Respiratory Infection / Pyrexia",
        confidence: 82,
        riskLevel: HealthStatus.attention,
        recommendations: [
          "Isolate the animal in a well-ventilated, shaded enclosure.",
          "Provide clean, lukewarm drinking water with electrolytes.",
          "Schedule veterinary teleconsultation for antibiotic and antipyretic prescription.",
        ],
      };
    }

    // 3. Skin Nodules / Lesions (LSD pattern)
    if (
      s.includes("sym_skinnodules") ||
      s.includes("sym_lesions") ||
      notes.includes("nodule") ||
      notes.includes("skin")
    ) {
      return {
        condition: "Suspected Lumpy Skin Disease (LSD) / Dermatitis",
        confidence: 86,
        riskLevel: HealthStatus.attention,
        recommendations: [
          "Quarantine the animal from the herd immediately to stop vector transmission.",
          "Apply neem-turmeric antiseptic paste to open sores; avoid inter-district movement.",
          "Notify local veterinary officer for containment protocol.",
        ],
      };
    }

    // 4. Mastitis / Udder swelling
    if (
      s.includes("sym_udder") ||
      s.includes("sym_milkyield") ||
      notes.includes("udder") ||
      notes.includes("mastitis")
    ) {
      return {
        condition: "Subclinical / Clinical Mastitis",
        confidence: 85,
        riskLevel: HealthStatus.attention,
        recommendations: [
          "Perform California Mastitis Test (CMT) strip screening.",
          "Ensure complete strippings of affected quarter and hygienic teat dipping.",
          "Consult vet for intramammary infusion course.",
        ],
      };
    }

    // 5. Mild indigestion or reduced appetite
    if (appetite.includes("reduced") || s.includes("sym_lossofappetite")) {
      return {
        condition: "Mild Indigestion / Ruminal Inactivity",
        confidence: 74,
        riskLevel: HealthStatus.attention,
        recommendations: [
          "Provide dry fodder and digestive probiotics (yeast culture bolus).",
          "Monitor rumination and defecation for 24 hours.",
        ],
      };
    }

    // 6. Healthy / Low Risk default
    return {
      condition: "Healthy / Low Risk (Normal Vital Parameters)",
      confidence: 94,
      riskLevel: HealthStatus.healthy,
      recommendations: [
        "Continue routine feeding and hydration balance.",
        "Ensure scheduled seasonal vaccinations remain up to date.",
      ],
    };
  }

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

    let geminiResult: any = null;
    let modelTierUsed: ModelTierUsed = "pro";
    let fallbackReason: string | null = null;

    const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
    let useFallback = false;

    if (!apiKey) {
      console.warn("[DiagnosticService] GEMINI_API_KEY is not configured. Falling back to deterministic rule-based triage.");
      useFallback = true;
      fallbackReason = "GEMINI_API_KEY is not configured.";
    }

    let condition = "Unknown";
    let confidence = 0;
    let recommendations: string[] = [];
    let escalateTo1962 = false;
    let riskLevel: HealthStatus = HealthStatus.attention;
    let screeningStatus: ScreeningStatus = ScreeningStatus.New;
    let geminiVisualFindings = "";
    let geminiSymptomFindings = "";
    let geminiReasoning = "";

    if (!useFallback) {
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
        condition = geminiResult.condition;
        confidence = geminiResult.confidence;
        recommendations = [geminiResult.recommended_action];
        escalateTo1962 = geminiResult.escalate_to_1962;
        geminiVisualFindings = geminiResult.visual_findings;
        geminiSymptomFindings = geminiResult.symptom_findings;
        geminiReasoning = geminiResult.reasoning;

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
            riskLevel = HealthStatus.attention;
            screeningStatus = ScreeningStatus.Under_Review;
            break;
        }
      } catch (err: any) {
        fallbackReason = err?.message || String(err);
        console.warn(`[DiagnosticService] Gemini screening error: ${fallbackReason}. Falling back to rules.`);
        useFallback = true;
      }
    }

    if (useFallback) {
      // Execute rule-based deterministic fallback
      modelTierUsed = "rule_based_fallback" as any;
      const evaluation = this.evaluateSymptoms(data);
      condition = evaluation.condition;
      confidence = evaluation.confidence;
      riskLevel = evaluation.riskLevel;
      recommendations = evaluation.recommendations;
      escalateTo1962 = riskLevel === HealthStatus.urgent;
      geminiReasoning = "Evaluated by deterministic triage engine due to Gemini unavailability.";
    }


    const id = `AR-${Math.floor(1000 + Math.random() * 9000)}`;

    // Serialize audit metadata including model_tier_used and visual/symptom findings
    const auditNotes = JSON.stringify({
      userNotes: data.notes || "",
      model_tier_used: modelTierUsed,
      fallbackReason: fallbackReason || undefined,
      visual_findings: geminiVisualFindings || "",
      symptom_findings: geminiSymptomFindings || "",
      reasoning: geminiReasoning || "",
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
          (geminiResult ? geminiResult.species_check : null) ||
          (animal.species?.toLowerCase().includes("buffalo") ? "buffalo" : "cattle"),
        condition,
        confidence,
        severity:
          (geminiResult ? geminiResult.severity : null) ||
          (riskLevel === HealthStatus.urgent
            ? "emergency"
            : riskLevel === HealthStatus.attention
            ? "moderate"
            : "routine"),
        visual_findings: geminiVisualFindings || "",
        symptom_findings:
          geminiSymptomFindings || (data.reportedSymptoms || []).join(", "),
        reasoning:
          geminiReasoning ||
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
