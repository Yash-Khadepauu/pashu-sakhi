import { Request, Response, NextFunction } from "express";
import { HotspotService } from "../services/hotspot.service";
import { sendSuccess } from "../utils/apiResponse";

export class HotspotController {
  static async listHotspots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hotspots = await HotspotService.listHotspots();
      sendSuccess(res, { hotspots, count: hotspots.length }, "Outbreak hotspots retrieved.");
    } catch (error) {
      next(error);
    }
  }

  static async getHotspotById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hotspot = await HotspotService.getHotspotById(req.params.id);
      sendSuccess(res, { hotspot }, "Outbreak hotspot details retrieved.");
    } catch (error) {
      next(error);
    }
  }
}
