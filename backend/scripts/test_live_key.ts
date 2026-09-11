import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const apiKey = process.env.GEMINI_API_KEY;
console.log("Loaded API Key:", apiKey ? `Present (length ${apiKey.length}, prefix ${apiKey.slice(0, 8)}...)` : "NOT FOUND");

const ai = new GoogleGenAI({ apiKey });

async function check() {
  const modelsToTest = [
    "gemini-3.1-pro-preview",
    "gemini-3.6-flash",
    "gemini-2.5-flash",
  ];
  for (const m of modelsToTest) {
    try {
      console.log(`\nTesting model: ${m}...`);
      const response = await ai.models.generateContent({
        model: m,
        contents: "Respond with only 'VET_ONLINE'",
      });
      console.log(`✅ ${m} SUCCESS! Response:`, response.text?.trim());
      return m;
    } catch (err: any) {
      console.error(`❌ ${m} FAILED:`, err?.status, err?.message || err);
    }
  }

  // If none matched, list available models
  try {
    console.log("\nListing available models from API...");
    const list = await ai.models.list();
    for await (const model of list) {
      console.log(" - Available Model:", model.name);
    }
  } catch (listErr: any) {
    console.error("Failed to list models:", listErr?.message || listErr);
  }
}

check().then((workingModel) => {
  console.log("\nActive Working Model:", workingModel);
  process.exit(0);
}).catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
