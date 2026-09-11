import prisma from "../config/database";
import { AppError } from "../utils/apiError";
import { ComplaintStatus } from "@prisma/client";

export class ComplaintService {
  static async submitComplaint(
    submittedById: string,
    data: { category: string; description: string }
  ) {
    const id = `CP-${Math.floor(100 + Math.random() * 900)}`;

    const complaint = await prisma.complaint.create({
      data: {
        id,
        submittedById,
        category: data.category.trim(),
        description: data.description.trim(),
        status: ComplaintStatus.New,
      },
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return complaint;
  }

  static async listComplaints(user: { id: string; role: string }) {
    const whereClause: any = {};
    if (user.role !== "admin") {
      whereClause.submittedById = user.id;
    }

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        submittedBy: { select: { id: true, name: true, email: true, mobile: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return complaints;
  }

  static async updateComplaint(
    complaintId: string,
    data: {
      status?: "New" | "Under_Review" | "Resolved";
      assignedToId?: string;
      resolutionNotes?: string;
    }
  ) {
    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) {
      throw new AppError("Complaint ticket not found.", 404);
    }

    const updates: any = {};
    if (data.status) {
      updates.status = data.status as ComplaintStatus;
      if (data.status === "Resolved") {
        updates.resolvedAt = new Date();
      }
    }
    if (data.assignedToId) {
      updates.assignedToId = data.assignedToId;
    }
    if (data.resolutionNotes) {
      updates.resolutionNotes = data.resolutionNotes;
    }

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: updates,
      include: {
        submittedBy: { select: { name: true, email: true } },
        assignedTo: { select: { name: true } },
      },
    });

    return updated;
  }
}
