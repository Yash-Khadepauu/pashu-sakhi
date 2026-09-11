import { GoogleGenAI } from "@google/genai";
import { VETERINARY_SYSTEM_PROMPT, VETERINARY_RESPONSE_SCHEMA } from "../src/services/gemini.service";
import sharp from "sharp";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testAllModelsWithImage() {
  const imageBuffer = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 180, g: 130, b: 70 } }
  }).jpeg().toBuffer();

  const candidates = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3-flash-preview",
    "gemini-flash-latest"
  ];

  for (const m of candidates) {
    try {
      console.log(`\nTrying ${m} with image...`);
      const res = await ai.models.generateContent({
        model: m,
        config: {
          systemInstruction: VETERINARY_SYSTEM_PROMPT,
          temperature: 0.15,
          responseMimeType: "application/json",
          responseSchema: VETERINARY_RESPONSE_SCHEMA,
        },
        contents: [
          { inlineData: { mimeType: "image/jpeg", data: imageBuffer.toString("base64") } },
          { text: "Evaluate this livestock image." }
        ]
      });
      console.log(`✅ ${m} WORKED! Response length: ${res.text?.length}`);
      console.log("Snippet:", res.text?.slice(0, 150));
      return m;
    } catch (e: any) {
      console.log(`❌ ${m} error:`, e?.status || e?.code, e?.message?.slice(0, 120) || e);
    }
  }
}

testAllModelsWithImage().catch(console.error);
