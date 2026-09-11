export class AppError extends Error {
  public statusCode: number;
  public details: any;

  constructor(message: string, statusCode: number = 400, details: any = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
