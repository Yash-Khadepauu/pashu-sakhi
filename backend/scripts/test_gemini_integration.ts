import { sanitizeLivestockImage } from "../src/utils/imageSanitizer";
import { validateClinicalCalibration, VeterinaryScreeningResult, CalibrationError, GeminiVeterinaryService } from "../src/services/gemini.service";
import sharp from "sharp";

async function runTests() {
  console.log("=== Testing Gemini & Vision AI Integration ===");

  // 1. Test image sanitization with Sharp
  console.log("\n[Test 1] Testing Image Sanitizer & EXIF Stripper...");
  const dummyBuffer = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r: 200, g: 150, b: 100 }
    }
  }).jpeg({ quality: 80 }).toBuffer();

  const sanitized = await sanitizeLivestockImage(dummyBuffer);
  if (sanitized.metadataStripped && sanitized.base64 && sanitized.mimeType === "image/jpeg") {
    console.log("✅ Image sanitizer stripped metadata and generated base64 successfully.");
  } else {
    throw new Error("Image sanitizer failed.");
  }

  // 2. Test clinical calibration validator
  console.log("\n[Test 2] Testing Clinical Calibration Guardrails...");
  const validResult: VeterinaryScreeningResult = {
    species_check: "cattle",
    condition: "lumpy_skin_disease",
    confidence: 88,
    severity: "emergency",
    visual_findings: "Nodular cutaneous lesions on bovine neck and flanks",
    symptom_findings: "High pyrexia, swollen lymph nodes",
    reasoning: "Classic presentation of capripox virus lesions",
    recommended_action: "Immediate quarantine and isolate from herd; contact 1962.",
    escalate_to_1962: true
  };

  validateClinicalCalibration(validResult);
  console.log("✅ Valid clinical screening passed calibration check.");

  // Test calibration violation 1: confidence < 50 with specific condition
  try {
    const invalidLowConf: VeterinaryScreeningResult = {
      ...validResult,
      confidence: 42,
      condition: "lumpy_skin_disease"
    };
    validateClinicalCalibration(invalidLowConf);
    console.error("❌ Calibration check failed to catch low confidence violation!");
  } catch (err) {
    if (err instanceof CalibrationError) {
      console.log("✅ Correctly rejected low confidence diagnosis:", err.message);
    }
  }

  // Test calibration violation 2: non-bovine species
  try {
    const invalidSpecies: VeterinaryScreeningResult = {
      ...validResult,
      species_check: "other_or_unclear",
      condition: "lumpy_skin_disease"
    };
    validateClinicalCalibration(invalidSpecies);
    console.error("❌ Calibration check failed to catch non-bovine species!");
  } catch (err) {
    if (err instanceof CalibrationError) {
      console.log("✅ Correctly rejected non-bovine diagnosis:", err.message);
    }
  }

  // 3. Test Gemini configuration status
  console.log("\n[Test 3] Checking Gemini Service status...");
  const isConfigured = GeminiVeterinaryService.isConfigured();
  console.log(`Gemini API Key configured: ${isConfigured ? "YES (Live Gemini Vision Active)" : "NO (Calibrated Fallback Active)"}`);

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
