import { Request, Response } from "express";
import { sendError } from "../utils/apiResponse";

export function notFoundHandler(req: Request, res: Response): Response {
  return sendError(
    res,
    `Cannot ${req.method} ${req.originalUrl}. Route not found on this server.`,
    404
  );
}
