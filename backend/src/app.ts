import express, { Application } from "express";
import cors from "cors";
import { env } from "./config/env";
import rootRouter from "./routes/index";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";

const app: Application = express();

// ---------------------------------------------------------------------------
// Core Middlewares
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Allow all origins, including file:/// (which is 'null' or undefined) and localhost
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ---------------------------------------------------------------------------
// Root Route Redirection / Info
// ---------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    project: "PashuSakhi Livestock Healthcare System",
    version: "1.0.0",
    docs: "/api/health",
    apiPrefix: "/api/v1",
  });
});

// ---------------------------------------------------------------------------
// API Routes (/api)
// ---------------------------------------------------------------------------
app.use("/api", rootRouter);

// ---------------------------------------------------------------------------
// Error Handling Middlewares
// ---------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
