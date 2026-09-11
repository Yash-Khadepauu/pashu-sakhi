import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/apiError";
import { sendError } from "../utils/apiResponse";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Response {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.details);
  }

  // Handle Prisma unique constraint violation (P2002)
  if (err?.code === "P2002") {
    const target = (err.meta?.target as string[]) || ["field"];
    return sendError(
      res,
      `A record with this ${target.join(", ")} already exists.`,
      409,
      { fields: target }
    );
  }

  // Handle Prisma record not found (P2025)
  if (err?.code === "P2025") {
    return sendError(res, "Requested record was not found.", 404);
  }

  console.error("Unhandled Server Error:", err);
  return sendError(
    res,
    process.env.NODE_ENV === "production"
      ? "An unexpected internal error occurred."
      : err.message || "Internal server error",
    500
  );
}
