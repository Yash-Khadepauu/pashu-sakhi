import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const models = await ai.models.list();
  const names: string[] = [];
  for await (const m of models) {
    names.push(m.name || "");
  }
  console.log("Total models:", names.length);
  console.log(names.filter(n => n.includes("gemini") || n.includes("flash") || n.includes("pro")).join("\n"));
}

main().catch(console.error);
