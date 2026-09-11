import { GoogleGenAI } from "@google/genai";
import { VETERINARY_SYSTEM_PROMPT, VETERINARY_RESPONSE_SCHEMA, GeminiVeterinaryService } from "../src/services/gemini.service";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function testStructured() {
  const models = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.8-flash"];
  for (const m of models) {
    try {
      console.log(`\nTesting structured output with ${m}...`);
      const response = await ai.models.generateContent({
        model: m,
        config: {
          systemInstruction: VETERINARY_SYSTEM_PROMPT,
          temperature: 0.15,
          responseMimeType: "application/json",
          responseSchema: VETERINARY_RESPONSE_SCHEMA,
        },
        contents: [
          { text: "Animal: Cow. Symptoms: high fever 104F, nodules across skin, not eating, depressed." }
        ]
      });

      console.log(`✅ ${m} SUCCESS! Response text:\n`, response.text);
      const validated = GeminiVeterinaryService.parseAndValidate(response.text);
      console.log("\n✅ Parsed & Validated:\n", validated);
      return m;
    } catch (e: any) {
      console.error(`❌ ${m} error:`, e?.status, e?.message || e);
    }
  }
}

testStructured().catch(console.error);
