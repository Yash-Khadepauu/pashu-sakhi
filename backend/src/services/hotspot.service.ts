import prisma from "../config/database";
import { AppError } from "../utils/apiError";

export class HotspotService {
  static async listHotspots() {
    const hotspots = await prisma.outbreakHotspot.findMany({
      orderBy: { affectedAnimalsCount: "desc" },
    });
    return hotspots;
  }

  static async getHotspotById(id: string) {
    const hotspot = await prisma.outbreakHotspot.findUnique({
      where: { id },
    });

    if (!hotspot) {
      throw new AppError("Outbreak hotspot not found.", 404);
    }

    return hotspot;
  }
}
