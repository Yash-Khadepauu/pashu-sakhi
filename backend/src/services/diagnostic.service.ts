import prisma from "../config/database";
import { AppError } from "../utils/apiError";
import { HealthStatus, ScreeningStatus, ScreeningType } from "@prisma/client";
import { GeminiVeterinaryService } from "./gemini.service";

function mapGeminiConditionName(condition: string): string {
  switch (condition) {
    case "lumpy_skin_disease":
      return "Suspected Lumpy Skin Disease (LSD)";
    case "mouth_or_hoof_lesion_concern":
      return "Mouth / Hoof Lesions Concern";
    case "possible_contagious_skin_disease":
      return "Contagious Bovine Dermatitis / Lesions";
    case "mastitis_concern":
      return "Suspected Clinical Mastitis";
    case "bloat_or_digestive_distress":
      return "Ruminal Bloat & Digestive Distress";
    case "no_visible_disease":
      return "No Visible Disease Markers";
    case "unable_to_assess":
    default:
      return "Inconclusive / Needs Clinical Examination";
  }
}

function mapGeminiSeverityToHealthStatus(severity: string): HealthStatus {
  switch (severity) {
    case "emergency":
      return HealthStatus.urgent;
    case "moderate":
      return HealthStatus.attention;
    case "routine":
    case "no_visible_disease":
    default:
      return HealthStatus.healthy;
  }
}

interface SymptomInput {
  reportedSymptoms: string[];
  temperatureSelected?: string;
  appetiteSelected?: string;
  activitySelected?: string;
  notes?: string;
}

interface DiagnosticResult {
  condition: string;
  confidence: number;
  riskLevel: HealthStatus;
  recommendations: string[];
}

export class DiagnosticService {
  /**
   * Deterministic, rule-based diagnostic classifier simulating AI clinical triage.
   * Isolates triage decision logic so that real PyTorch/CV microservices can be plugged in later seamlessly.
   */
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
      image?: string;
      geminiApiKey?: string;
    },
    customKey?: string
  ) {
    const effectiveKey = customKey || data.geminiApiKey;
    const animal = await prisma.animal.findUnique({ where: { id: data.animalId } });
    if (!animal || animal.deletedAt || animal.ownerId !== farmerId) {
      throw new AppError("Invalid animal ID or you do not own this animal.", 400);
    }

    const rawImage = data.image || data.imageUrl;
    let evaluation: DiagnosticResult;
    let geminiOutput: any = null;

    if (GeminiVeterinaryService.isConfigured(effectiveKey) && (rawImage || (data.reportedSymptoms && data.reportedSymptoms.length > 0))) {
      try {
        console.log(`[DiagnosticService] Invoking live Google Gemini model for screening...`);
        const geminiRes = await GeminiVeterinaryService.screenLivestock({
          image: rawImage,
          symptomsSummary: data.reportedSymptoms?.join(", "),
          temperature: data.temperatureSelected,
          appetite: data.appetiteSelected,
          activity: data.activitySelected,
          notes: data.notes,
        }, effectiveKey);

        geminiOutput = geminiRes;
        evaluation = {
          condition: mapGeminiConditionName(geminiRes.condition),
          confidence: geminiRes.confidence,
          riskLevel: mapGeminiSeverityToHealthStatus(geminiRes.severity),
          recommendations: [
            geminiRes.recommended_action,
            geminiRes.reasoning,
            geminiRes.visual_findings ? `Visual Assessment: ${geminiRes.visual_findings}` : "",
            geminiRes.symptom_findings ? `Symptom Findings: ${geminiRes.symptom_findings}` : "",
            geminiRes.escalate_to_1962 ? "URGENT: Escalate immediately to emergency veterinary helpline (1962)." : ""
          ].filter(Boolean),
        };
      } catch (err: any) {
        console.warn(`[DiagnosticService] Gemini model invocation failed, falling back to calibrated rule-based triage:`, err?.message || err);
        evaluation = this.evaluateSymptoms(data);
      }
    } else {
      evaluation = this.evaluateSymptoms(data);
    }

    const id = `AR-${Math.floor(1000 + Math.random() * 9000)}`;

    const effectiveNotes = geminiOutput
      ? `${data.notes || ""}\n[AI Model: ${geminiOutput.model_tier_used}] ${geminiOutput.visual_findings || ""}`.trim()
      : data.notes;

    const log = await prisma.screeningLog.create({
      data: {
        id,
        animalId: data.animalId,
        farmerId,
        screeningType:
          rawImage || data.screeningType === "image_detection"
            ? ScreeningType.image_detection
            : ScreeningType.symptom_triage,
        imageUrl: rawImage,
        reportedSymptoms: JSON.stringify(data.reportedSymptoms),
        temperatureSelected: data.temperatureSelected,
        appetiteSelected: data.appetiteSelected,
        activitySelected: data.activitySelected,
        notes: effectiveNotes,
        aiPredictedCondition: evaluation.condition,
        confidenceScore: evaluation.confidence,
        riskLevel: evaluation.riskLevel,
        status: ScreeningStatus.New,
      },
      include: {
        animal: true,
      },
    });

    // Automatically update animal's current health status if evaluated as urgent or attention
    if (evaluation.riskLevel !== HealthStatus.healthy) {
      await prisma.animal.update({
        where: { id: data.animalId },
        data: { healthStatus: evaluation.riskLevel },
      });
    }

    return {
      log,
      recommendations: evaluation.recommendations,
      aiTriage: geminiOutput ? {
        condition: geminiOutput.condition,
        confidence: geminiOutput.confidence,
        severity: geminiOutput.severity,
        visualFindings: geminiOutput.visual_findings,
        symptomFindings: geminiOutput.symptom_findings,
        reasoning: geminiOutput.reasoning,
        recommendedAction: geminiOutput.recommended_action,
        escalateTo1962: geminiOutput.escalate_to_1962,
        modelTier: geminiOutput.model_tier_used
      } : null
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
