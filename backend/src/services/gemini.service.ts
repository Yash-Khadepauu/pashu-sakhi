import { GoogleGenAI, Type, Schema } from "@google/genai";
import { z } from "zod";
import { env } from "../config/env";
import { sanitizeLivestockImage } from "../utils/imageSanitizer";

export type ModelTierUsed = "pro" | "flash_fallback" | "rule_based_fallback";

export const VETERINARY_SYSTEM_PROMPT = `
SYSTEM PROMPT:

You are a veterinary screening assistant supporting a livestock health application
used by farmers and veterinarians in Maharashtra, India. You analyze one photo and optional
text-described symptoms of a single animal (cattle or buffalo only).

You are NOT providing a definitive clinical diagnosis. You are producing a preliminary triage screening to help a
farmer decide urgency of veterinary action and first aid. Your output directly affects whether a
farmer contacts emergency veterinary services (1962 helpline) or isolates the animal.

SCOPE — SPECIES:
Only cattle and buffalo are in scope. If the image does not clearly show
cattle or buffalo, or the animal is not identifiable, set species_check
to "other_or_unclear" and condition to "unable_to_assess".

SCOPE — CONDITIONS (choose exactly one, never invent others):
- "lumpy_skin_disease" — nodular skin lesions, cutaneous nodules, fever signs consistent with LSD
- "possible_contagious_skin_disease" — skin lesions suggestive of ringworm/dermatophilosis/mange, not clearly LSD
- "mouth_or_hoof_lesion_concern" — oral or interdigital hoof lesions, salivation, lameness
- "mastitis_concern" — swollen, warm udder, milk discoloration, or quarter hardness
- "bloat_or_digestive_distress" — distended left flank, ruminal tympany, colic symptoms
- "no_visible_disease" — animal appears visually healthy with no abnormal lesions observed
- "unable_to_assess" — image quality too poor, wrong species, or insufficient visual/symptom evidence

CONFIDENCE (0-100) — calibration rubric, follow strictly:
- 80-100: Clear, specific visual markers strongly consistent with one condition, and symptom text does not contradict it
- 50-79: Some relevant visual markers present but ambiguous, overlapping with another condition, or symptom text only partially consistent
- 0-49: Weak or unclear visual evidence — condition MUST be "unable_to_assess" regardless of what you think you see.

SEVERITY (judge this on risk, independent of your diagnostic confidence):
- "emergency": any of — persistent high fever (>104°F), inability to stand, severe bloat/respiratory distress, refusal to eat or drink, rapidly spreading nodular outbreak across herd, visible agony/open bleeding wounds
- "moderate": localized or early-stage signs, animal otherwise stable, mild fever, eating partially
- "routine": mild or ambiguous superficial signs only, no systemic symptoms, single animal affected
- "unable_to_assess": insufficient information to judge risk — default to recommending an in-person veterinary check

CONFLICTS AND UNCERTAINTY (BIDIRECTIONAL CAUTION BIAS):
- If visual findings and symptom text disagree, state this explicitly in "reasoning".
- Direction A (Mild visual + severe symptoms): Always escalate severity to "emergency" or "moderate" based on reported distress, and set escalate_to_1962 to true.
- Direction B (Severe visual lesions + reassuring farmer symptoms): Reassuring farmer statements cannot downgrade severity of severe lesions. Always maintain "emergency" or "moderate".
`;

export const VETERINARY_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    species_check: {
      type: Type.STRING,
      enum: ["cattle", "buffalo", "other_or_unclear"],
    },
    condition: {
      type: Type.STRING,
      enum: [
        "lumpy_skin_disease",
        "possible_contagious_skin_disease",
        "mouth_or_hoof_lesion_concern",
        "mastitis_concern",
        "bloat_or_digestive_distress",
        "no_visible_disease",
        "unable_to_assess",
      ],
    },
    confidence: { type: Type.INTEGER },
    severity: {
      type: Type.STRING,
      enum: ["emergency", "moderate", "routine", "unable_to_assess"],
    },
    visual_findings: { type: Type.STRING },
    symptom_findings: { type: Type.STRING },
    reasoning: { type: Type.STRING },
    recommended_action: { type: Type.STRING },
    escalate_to_1962: { type: Type.BOOLEAN },
  },
  required: [
    "species_check",
    "condition",
    "confidence",
    "severity",
    "visual_findings",
    "symptom_findings",
    "reasoning",
    "recommended_action",
    "escalate_to_1962",
  ],
};

export const VeterinaryScreeningResultZod = z.object({
  species_check: z.enum(["cattle", "buffalo", "other_or_unclear"]),
  condition: z.enum([
    "lumpy_skin_disease",
    "possible_contagious_skin_disease",
    "mouth_or_hoof_lesion_concern",
    "mastitis_concern",
    "bloat_or_digestive_distress",
    "no_visible_disease",
    "unable_to_assess",
  ]),
  confidence: z.number().int().min(0).max(100),
  severity: z.enum(["emergency", "moderate", "routine", "unable_to_assess"]),
  visual_findings: z.string(),
  symptom_findings: z.string(),
  reasoning: z.string(),
  recommended_action: z.string(),
  escalate_to_1962: z.boolean(),
});

export type VeterinaryScreeningResult = z.infer<typeof VeterinaryScreeningResultZod>;

export interface VeterinaryScreeningOutput extends VeterinaryScreeningResult {
  model_tier_used: ModelTierUsed;
}

export class CalibrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalibrationError";
  }
}

/**
 * Validates clinical calibration safety rules:
 * 1. Confidence < 50 requires condition === "unable_to_assess"
 * 2. species_check === "other_or_unclear" requires condition === "unable_to_assess"
 */
export function validateClinicalCalibration(result: VeterinaryScreeningResult): void {
  if (result.confidence < 50 && result.condition !== "unable_to_assess") {
    throw new CalibrationError(
      `Calibration violation: confidence is ${result.confidence} (<50) but condition is "${result.condition}" (expected "unable_to_assess")`
    );
  }
  if (result.species_check === "other_or_unclear" && result.condition !== "unable_to_assess") {
    throw new CalibrationError(
      `Calibration violation: species_check is "other_or_unclear" but condition is "${result.condition}" (expected "unable_to_assess")`
    );
  }
}

export class GeminiVeterinaryService {
  private static client: GoogleGenAI | null = null;

  public static getClient(overrideKey?: string): GoogleGenAI {
    const key = (overrideKey && overrideKey.trim().length > 0) ? overrideKey.trim() : (process.env.GEMINI_API_KEY || env.GEMINI_API_KEY);
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured in .env or passed via request");
    }
    return new GoogleGenAI({ apiKey: key });
  }

  public static isConfigured(overrideKey?: string): boolean {
    const key = (overrideKey && overrideKey.trim().length > 0) ? overrideKey.trim() : (process.env.GEMINI_API_KEY || env.GEMINI_API_KEY);
    return Boolean(key && key.trim().length > 0);
  }

  /**
   * Dispatches clinical screening through accuracy-first model tiers:
   * 1. Primary tier (default: gemini-2.5-flash / gemini-2.5-pro)
   * 2. Flash tier: gemini-flash-latest (on technical errors: timeout, network error, malformed JSON)
   * 3. Calibration errors: skips Flash tier directly so caller falls back to calibrated rule-based triage.
   */
  public static async screenLivestock(
    input: {
      image?: Buffer | string;
      symptomsSummary?: string;
      temperature?: string;
      appetite?: string;
      activity?: string;
      notes?: string;
    },
    overrideKey?: string
  ): Promise<VeterinaryScreeningOutput> {
    const ai = this.getClient(overrideKey);

    // Prepare contents: sanitize image to strip EXIF/GPS tags before dispatch
    const contents: any[] = [];

    if (input.image) {
      const sanitized = await sanitizeLivestockImage(input.image);
      contents.push({
        inlineData: {
          mimeType: sanitized.mimeType,
          data: sanitized.base64,
        },
      });
    }

    // Prepare symptom text prompt
    const symptomParts: string[] = [];
    if (input.symptomsSummary) symptomParts.push(`Reported Symptoms: ${input.symptomsSummary}`);
    if (input.temperature) symptomParts.push(`Temperature: ${input.temperature}`);
    if (input.appetite) symptomParts.push(`Appetite: ${input.appetite}`);
    if (input.activity) symptomParts.push(`Activity: ${input.activity}`);
    if (input.notes) symptomParts.push(`Farmer Notes: ${input.notes}`);

    const promptText =
      symptomParts.length > 0
        ? `Animal Health Information:\n${symptomParts.join("\n")}`
        : "No symptom description provided. Evaluate based on the photograph alone, or assess input completeness.";

    contents.push({ text: promptText });

    const primaryModel =
      process.env.GEMINI_PRIMARY_MODEL || env.GEMINI_PRIMARY_MODEL || "gemini-2.5-flash";
    const fallbackModel =
      process.env.GEMINI_FALLBACK_MODEL || env.GEMINI_FALLBACK_MODEL || "gemini-flash-latest";

    console.log(`[GeminiVeterinaryService] 📡 Dispatching veterinary triage request to ${primaryModel}...`);

    // Attempt 1: Primary Tier
    try {
      const response = await ai.models.generateContent({
        model: primaryModel,
        config: {
          systemInstruction: VETERINARY_SYSTEM_PROMPT,
          temperature: 0.15,
          responseMimeType: "application/json",
          responseSchema: VETERINARY_RESPONSE_SCHEMA,
        },
        contents,
      });

      const parsed = this.parseAndValidate(response.text);
      console.log(`[GeminiVeterinaryService] ✅ Primary tier (${primaryModel}) succeeded:`, parsed.condition, `(confidence: ${parsed.confidence}%)`);
      return {
        ...parsed,
        model_tier_used: "pro",
      };
    } catch (primaryError: any) {
      if (primaryError instanceof CalibrationError) {
        console.warn(
          `[GeminiVeterinaryService] Primary model (${primaryModel}) calibration failure: ${primaryError.message}. Skipping Flash retry.`
        );
        throw primaryError;
      }

      console.warn(
        `[GeminiVeterinaryService] ⚠️ Technical failure on primary tier (${primaryModel}): ${primaryError?.message || primaryError}. Retrying with fallback (${fallbackModel})...`
      );

      // Attempt 2: Fallback Tier
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: fallbackModel,
          config: {
            systemInstruction: VETERINARY_SYSTEM_PROMPT,
            temperature: 0.15,
            responseMimeType: "application/json",
            responseSchema: VETERINARY_RESPONSE_SCHEMA,
          },
          contents,
        });

        const parsed = this.parseAndValidate(fallbackResponse.text);
        console.log(`[GeminiVeterinaryService] ✅ Fallback tier (${fallbackModel}) succeeded:`, parsed.condition, `(confidence: ${parsed.confidence}%)`);
        return {
          ...parsed,
          model_tier_used: "flash_fallback",
        };
      } catch (fallbackError: any) {
        console.error(
          `[GeminiVeterinaryService] ❌ Fallback tier (${fallbackModel}) also failed: ${fallbackError?.message || fallbackError}.`
        );
        throw fallbackError;
      }
    }
  }

  /**
   * Parses JSON response, validates against Zod schema, and enforces clinical calibration.
   */
  public static parseAndValidate(rawText: string | undefined): VeterinaryScreeningResult {
    if (!rawText || !rawText.trim()) {
      throw new Error("Empty response received from Gemini model.");
    }

    let jsonObject: any;
    try {
      jsonObject = JSON.parse(rawText.trim());
    } catch (err: any) {
      throw new Error(`Malformed JSON response from model: ${err?.message || err}`);
    }

    const parseResult = VeterinaryScreeningResultZod.safeParse(jsonObject);
    if (!parseResult.success) {
      throw new Error(
        `Gemini response failed schema validation: ${parseResult.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
    }

    const validated = parseResult.data;
    validateClinicalCalibration(validated);

    return validated;
  }
}
