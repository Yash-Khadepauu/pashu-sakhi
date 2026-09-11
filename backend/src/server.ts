import app from "./app";
import { env } from "./config/env";
import prisma, { checkDatabaseConnection } from "./config/database";

const PORT = env.PORT;

const server = app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🐾 PashuSakhi Backend Server Running!`);
  console.log(`📡 Port:        ${PORT}`);
  console.log(`🌐 Environment: ${env.NODE_ENV}`);
  console.log(`🩺 Health API:  http://localhost:${PORT}/api/health`);
  console.log(`🚀 API Base:    http://localhost:${PORT}/api/v1`);
  console.log(`====================================================`);

  const dbConnected = await checkDatabaseConnection();
  if (dbConnected) {
    console.log(`✅ PostgreSQL Database: Connected successfully.`);
  } else {
    console.warn(`⚠️ PostgreSQL Database: Not reachable on ${env.DATABASE_URL}.`);
    console.warn(`💡 Check database credentials in .env if running local migrations.`);
  }

  const geminiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
  if (geminiKey) {
    console.log(`🤖 Gemini AI: Active (Key length: ${geminiKey.length}, Primary: ${env.GEMINI_PRIMARY_MODEL}, Fallback: ${env.GEMINI_FALLBACK_MODEL})`);
  } else {
    console.error(`❌ Gemini AI: GEMINI_API_KEY is MISSING in .env!`);
  }
});

// Graceful Shutdown
async function handleShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log("🔌 Closed remaining active HTTP connections.");
    await prisma.$disconnect();
    console.log("🔒 Prisma database connection pool closed.");
    process.exit(0);
  });

  // Force close after 10 seconds if hanging
  setTimeout(() => {
    console.error("⚠️ Forced shutdown after 10s timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
