import dotenv from "dotenv";
import path from "path";

// Load .env file robustly from multiple candidate locations
const candidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "backend/.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
];

for (const p of candidates) {
  try {
    if (require("fs").existsSync(p)) {
      dotenv.config({ path: p });
      break;
    }
  } catch (e) {}
}

export const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/pashusakhi?schema=public",
  JWT_SECRET: process.env.JWT_SECRET || "pashusakhi_default_jwt_secret_change_me_2026",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_PRIMARY_MODEL: process.env.GEMINI_PRIMARY_MODEL || "gemini-2.5-flash",
  GEMINI_FALLBACK_MODEL: process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-latest",
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || "",
};

