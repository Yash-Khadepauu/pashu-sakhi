const EmbeddedPostgres = require("embedded-postgres").default;
const path = require("path");

const pg = new EmbeddedPostgres({
  port: 5432,
  user: "postgres",
  password: "password",
  databaseDir: path.resolve(__dirname, "../.pg_data"),
  persistent: true,
});

const fs = require("fs");

async function run() {
  const dataDir = path.resolve(__dirname, "../.pg_data");
  if (!fs.existsSync(dataDir)) {
    console.log("📦 Initializing PostgreSQL cluster in .pg_data...");
    await pg.initialise();
    console.log("✅ Cluster initialized.");
  }

  console.log("🐘 Starting local PostgreSQL on port 5432...");
  await pg.start();
  console.log("✅ PostgreSQL is ready and accepting connections on port 5432.");

  try {
    await pg.createDatabase("pashusakhi");
    console.log("✅ Database 'pashusakhi' ensured.");
  } catch (e) {
    // Database may already exist
  }
}

run().catch((err) => {
  console.error("❌ Failed to start PostgreSQL:", err);
  process.exit(1);
});


async function shutdown() {
  console.log("\n🛑 Stopping PostgreSQL...");
  try {
    await pg.stop();
    console.log("🔒 PostgreSQL stopped cleanly.");
  } catch (e) {
    console.error("Error stopping PG:", e);
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
