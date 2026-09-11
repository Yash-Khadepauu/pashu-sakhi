import prisma from "../config/database";
import { AppError } from "../utils/apiError";

export class UserService {
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mobile: true,
        villageLocation: true,
        preferredLanguage: true,
        theme: true,
        highContrast: true,
        status: true,
        createdAt: true,
        vetProfile: true,
      },
    });

    if (!user) {
      throw new AppError("Profile not found.", 404);
    }

    return user;
  }

  static async updateProfile(
    userId: string,
    updates: {
      name?: string;
      mobile?: string;
      villageLocation?: string;
      preferredLanguage?: string;
      theme?: string;
      highContrast?: boolean;
    }
  ) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mobile: true,
        villageLocation: true,
        preferredLanguage: true,
        theme: true,
        highContrast: true,
        updatedAt: true,
        vetProfile: true,
      },
    });

    return updated;
  }
}
