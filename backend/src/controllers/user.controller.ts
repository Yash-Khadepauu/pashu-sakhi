import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { sendSuccess } from "../utils/apiResponse";

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await UserService.getProfile(req.user!.id);
      sendSuccess(res, { profile }, "Profile retrieved successfully.");
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await UserService.updateProfile(req.user!.id, req.body);
      sendSuccess(res, { profile: updated }, "Profile updated successfully.");
    } catch (error) {
      next(error);
    }
  }
}
