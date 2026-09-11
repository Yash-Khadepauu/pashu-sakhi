import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";
import { AppError } from "../utils/apiError";
import prisma from "../config/database";

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication token is required.", 401);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new AppError("Authentication token missing.", 401);
    }

    let payload;
    try {
      payload = verifyJwt(token);
    } catch (err: any) {
      throw new AppError("Invalid or expired authentication token.", 401);
    }

    // Verify user still exists and is not suspended/inactive
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true, name: true, status: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new AppError("User account no longer exists.", 401);
    }

    if (user.status === "suspended") {
      throw new AppError("User account is suspended. Contact administration.", 403);
    }

    if (user.status === "inactive") {
      throw new AppError("User account is inactive.", 403);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("User is not authenticated.", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Requires one of the following roles: [${allowedRoles.join(", ")}].`,
          403
        )
      );
    }

    next();
  };
}
