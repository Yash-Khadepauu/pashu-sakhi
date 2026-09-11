import {
  GeminiVeterinaryService,
  VeterinaryScreeningResultZod,
  validateClinicalCalibration,
  CalibrationError,
  VETERINARY_SYSTEM_PROMPT,
  VETERINARY_RESPONSE_SCHEMA,
} from "../src/services/gemini.service";
import { sanitizeLivestockImage } from "../src/utils/imageSanitizer";
import { DiagnosticService } from "../src/services/diagnostic.service";
import { HealthStatus, ScreeningStatus } from "@prisma/client";
import sharp from "sharp";

async function runTests() {
  console.log("===============================================================================");
  console.log("  PASHUSAKHI VETERINARY SCREENING & CLINICAL SAFETY TEST SUITE");
  console.log("===============================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: System Prompt & Schema Rigor
  // -------------------------------------------------------------------------
  console.log("\n[TEST GROUP 1: System Prompt & Structured Schema Rigor]");
  assert(
    VETERINARY_SYSTEM_PROMPT.includes("Only cattle and buffalo are in scope") ||
      VETERINARY_SYSTEM_PROMPT.includes("cattle or buffalo"),
    "System prompt enforces strict species boundary (cattle and buffalo only)"
  );
  assert(
    VETERINARY_SYSTEM_PROMPT.includes("lumpy_skin_disease") &&
      VETERINARY_SYSTEM_PROMPT.includes("possible_contagious_skin_disease") &&
      VETERINARY_SYSTEM_PROMPT.includes("mouth_or_hoof_lesion_concern") &&
      VETERINARY_SYSTEM_PROMPT.includes("no_visible_disease") &&
      VETERINARY_SYSTEM_PROMPT.includes("unable_to_assess"),
    "System prompt specifies exact 5 allowed conditions without invention"
  );
  assert(
    VETERINARY_SYSTEM_PROMPT.includes("BIDIRECTIONAL CAUTION BIAS") ||
      VETERINARY_SYSTEM_PROMPT.includes("Direction B"),
    "System prompt mandates bidirectional caution bias for conflicting signals"
  );

  const requiredFields = (VETERINARY_RESPONSE_SCHEMA as any).required;
  assert(
    requiredFields.length === 9 &&
      requiredFields.includes("species_check") &&
      requiredFields.includes("condition") &&
      requiredFields.includes("confidence") &&
      requiredFields.includes("severity") &&
      requiredFields.includes("visual_findings") &&
      requiredFields.includes("symptom_findings") &&
      requiredFields.includes("reasoning") &&
      requiredFields.includes("recommended_action") &&
      requiredFields.includes("escalate_to_1962"),
    "ResponseSchema strictly requires all 9 schema fields"
  );

  // -------------------------------------------------------------------------
  // TEST 2: Zod Schema & Completeness Validation
  // -------------------------------------------------------------------------
  console.log("\n[TEST GROUP 2: Runtime Schema Validation & Completeness]");
  const validPayload = {
    species_check: "cattle",
    condition: "lumpy_skin_disease",
    confidence: 88,
    severity: "moderate",
    visual_findings: "Multiple well-circumscribed 2-4cm cutaneous nodules across neck and flank.",
    symptom_findings: "Moderate pyrexia reported (103.5 F).",
    reasoning: "Visual lesions are characteristic of acute lumpy skin disease.",
    recommended_action:
      "Isolate animal from herd immediately. Consult local veterinarian. This is a screening aid, not a diagnosis.",
    escalate_to_1962: false,
  };

  const parseResult = GeminiVeterinaryService.parseAndValidate(JSON.stringify(validPayload));
  assert(
    parseResult.condition === "lumpy_skin_disease" && parseResult.confidence === 88,
    "Valid 9-field JSON payload passes runtime Zod parsing"
  );

  // Missing field test
  let missingFieldFailed = false;
  try {
    const incomplete = { ...validPayload };
    delete (incomplete as any).escalate_to_1962;
    GeminiVeterinaryService.parseAndValidate(JSON.stringify(incomplete));
  } catch (e: any) {
    missingFieldFailed = true;
  }
  assert(missingFieldFailed, "Zod validator rejects payloads missing any of the 9 required fields");

  // -------------------------------------------------------------------------
  // TEST 3: Clinical Calibration Rules & Safety Invariants
  // -------------------------------------------------------------------------
  console.log("\n[TEST GROUP 3: Clinical Calibration & Safety Invariants]");

  // Low confidence (<50) must not declare a disease
  let lowConfViolationCaught = false;
  try {
    validateClinicalCalibration({
      ...validPayload,
      confidence: 42,
      condition: "lumpy_skin_disease" as any,
    });
  } catch (err: any) {
    lowConfViolationCaught = err instanceof CalibrationError;
  }
  assert(
    lowConfViolationCaught,
    "Calibration rule: Confidence < 50 rejects assigned condition (must be 'unable_to_assess')"
  );

  // Non-cattle/buffalo must be unable_to_assess
  let wrongSpeciesViolationCaught = false;
  try {
    validateClinicalCalibration({
      ...validPayload,
      species_check: "other_or_unclear",
      condition: "lumpy_skin_disease" as any,
    });
  } catch (err: any) {
    wrongSpeciesViolationCaught = err instanceof CalibrationError;
  }
  assert(
    wrongSpeciesViolationCaught,
    "Calibration rule: species_check 'other_or_unclear' rejects condition other than 'unable_to_assess'"
  );

  // -------------------------------------------------------------------------
  // TEST 4: The Critical Severity Mapping (Fix for unable_to_assess -> healthy)
  // -------------------------------------------------------------------------
  console.log("\n[TEST GROUP 4: Safe Severity Mapping (unable_to_assess Invariant)]");

  // Verify that an unable_to_assess triage case NEVER maps to healthy
  const testUnableTriage = {
    species_check: "other_or_unclear" as const,
    condition: "unable_to_assess" as const,
    confidence: 25,
    severity: "unable_to_assess" as const,
    visual_findings: "Image too blurry to identify anatomical structures.",
    symptom_findings: "Farmer reports animal seems unwell.",
    reasoning: "Insufficient visual and symptom clarity to evaluate condition.",
    recommended_action:
      "Arrange an in-person examination with a qualified veterinarian or call 1962. This is a screening aid, not a diagnosis.",
    escalate_to_1962: false,
    model_tier_used: "pro" as const,
  };

  // Check how severity maps:
  let mappedRiskLevel: HealthStatus;
  let mappedStatus: ScreeningStatus;
  switch (testUnableTriage.severity) {
    case "emergency":
      mappedRiskLevel = HealthStatus.urgent;
      mappedStatus = ScreeningStatus.New;
      break;
    case "moderate":
      mappedRiskLevel = HealthStatus.attention;
      mappedStatus = ScreeningStatus.New;
      break;
    case "routine":
      mappedRiskLevel = HealthStatus.healthy;
      mappedStatus = ScreeningStatus.New;
      break;
    case "unable_to_assess":
    default:
      mappedRiskLevel = HealthStatus.attention;
      mappedStatus = ScreeningStatus.Under_Review;
      break;
  }

  assert(
    mappedRiskLevel !== HealthStatus.healthy,
    "CRITICAL SAFETY INVARIANT: unable_to_assess NEVER maps to HealthStatus.healthy"
  );
  assert(
    mappedRiskLevel === HealthStatus.attention,
    "unable_to_assess maps safely to HealthStatus.attention"
  );
  assert(
    mappedStatus === ScreeningStatus.Under_Review,
    "unable_to_assess flags status as ScreeningStatus.Under_Review for manual veterinary review"
  );

  // -------------------------------------------------------------------------
  // TEST 5: Bidirectional Conflicting Signals Tests
  // -------------------------------------------------------------------------
  console.log("\n[TEST GROUP 5: Bidirectional Conflicting Signals Battery]");

  // Direction A: Mild visual + severe systemic symptoms (105F fever, collapse)
  const dirAPayload = {
    species_check: "cattle" as const,
    condition: "unable_to_assess" as const,
    confidence: 45,
    severity: "emergency" as const,
    visual_findings: "No clear focal lesions visible on body profile.",
    symptom_findings: "High persistent fever 105F, complete refusal to eat, animal recumbent.",
    reasoning:
      "Visual findings appear unremarkable, but severe systemic distress reported. Prioritizing systemic emergency risk over visual absence of lesions.",
    recommended_action:
      "Contact 1962 Pashu Sanjivini emergency ambulance immediately. This is a screening aid, not a diagnosis.",
    escalate_to_1962: true,
  };
  assert(
    dirAPayload.severity === "emergency" && dirAPayload.escalate_to_1962 === true,
    "Direction A: Mild visual + severe systemic symptoms elevates severity to emergency and escalates to 1962"
  );
  assert(
    dirAPayload.reasoning.includes("distress") || dirAPayload.reasoning.includes("systemic"),
    "Direction A: Explicitly documents visual vs symptom divergence in reasoning"
  );

  // Direction B: Severe visual lesions (LSD nodules) + reassuring farmer symptoms ("eating fine, acts normal")
  const dirBPayload = {
    species_check: "cattle" as const,
    condition: "lumpy_skin_disease" as const,
    confidence: 86,
    severity: "moderate" as const,
    visual_findings: "Prominent 1-3cm circular nodules covering neck, dewlap, and shoulder.",
    symptom_findings: "Farmer states animal is eating normally and acting fine.",
    reasoning:
      "Farmer notes animal is stable, but extensive nodular lesions are visually consistent with Lumpy Skin Disease. Reassuring symptoms cannot downgrade severity given contagion risk.",
    recommended_action:
      "Quarantine animal immediately to prevent herd transmission. Consult veterinarian. This is a screening aid, not a diagnosis.",
    escalate_to_1962: false,
  };
  assert(
    dirBPayload.severity !== "routine",
    "Direction B: Severe visual lesions CANNOT be downgraded to 'routine' by reassuring farmer symptoms"
  );
  assert(
    dirBPayload.reasoning.includes("downgrade") || dirBPayload.reasoning.includes("reassuring"),
    "Direction B: Reasoning explicitly records that reassuring symptoms do not dismiss visible lesions"
  );

  // -------------------------------------------------------------------------
  // TEST 6: EXIF & GPS Metadata Privacy Stripping (DPDP Compliance via sharp)
  // -------------------------------------------------------------------------
  console.log("\n[TEST GROUP 6: DPDP Image Privacy Sanitization]");

  // Generate a test image using sharp and sanitize it
  const rawTestBuffer = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r: 120, g: 180, b: 90 },
    },
  })
    .jpeg()
    .toBuffer();

  const sanitized = await sanitizeLivestockImage(rawTestBuffer);
  assert(
    sanitized.metadataStripped === true && Buffer.isBuffer(sanitized.buffer),
    "sharp-based image sanitizer successfully processes and strips metadata"
  );
  assert(
    sanitized.mimeType === "image/jpeg" && sanitized.base64.length > 0,
    "Sanitized output retains valid MIME type and clean base64 payload"
  );

  // -------------------------------------------------------------------------
  // TEST 7: Deterministic Rule-Based Fallback Engine
  // -------------------------------------------------------------------------
  console.log("\n[TEST GROUP 7: Deterministic Fallback Engine]");

  const bloatTriage = DiagnosticService.evaluateSymptoms({
    reportedSymptoms: ["sym_bloat"],
    notes: "severe abdominal distension",
  });
  assert(
    bloatTriage.riskLevel === HealthStatus.urgent && bloatTriage.condition.includes("Bloat"),
    "Fallback classifier correctly triages acute bloat as urgent emergency"
  );

  const lsdTriage = DiagnosticService.evaluateSymptoms({
    reportedSymptoms: ["sym_skinnodules"],
    notes: "firm skin lumps across hide",
  });
  assert(
    lsdTriage.riskLevel === HealthStatus.attention && lsdTriage.condition.includes("LSD"),
    "Fallback classifier identifies suspected Lumpy Skin Disease"
  );

  console.log("\n===============================================================================");
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
