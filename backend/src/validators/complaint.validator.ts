import { z } from "zod";

export const createComplaintSchema = z.object({
  body: z.object({
    category: z.string().min(2, "Complaint category is required."),
    description: z.string().min(5, "Description must be at least 5 characters."),
  }),
});

export const updateComplaintSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Complaint ID is required."),
  }),
  body: z.object({
    status: z.enum(["New", "Under_Review", "Resolved"]),
    assignedToId: z.string().optional(),
    resolutionNotes: z.string().optional(),
  }),
});
