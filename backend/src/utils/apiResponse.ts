import { Response } from "express";
import { ApiResponse } from "../types/api";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = "Operation completed successfully.",
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    statusCode,
    message,
    data,
    error: null,
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 400,
  error: any = null
): Response {
  const response: ApiResponse<null> = {
    success: false,
    statusCode,
    message,
    data: null,
    error: error ?? { message },
  };
  return res.status(statusCode).json(response);
}
