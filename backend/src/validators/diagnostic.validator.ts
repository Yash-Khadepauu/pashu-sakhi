import { z } from "zod";

export const symptomScreeningSchema = z.object({
  body: z.object({
    animalId: z.string().min(1, "Animal ID is required."),
    reportedSymptoms: z.array(z.string()).default([]),
    temperatureSelected: z.string().optional(),
    appetiteSelected: z.string().optional(),
    activitySelected: z.string().optional(),
    notes: z.string().optional(),
    screeningType: z.enum(["symptom_triage", "image_detection"]).optional().default("symptom_triage"),
    imageUrl: z.string().optional(),
  }),
});

export const updateReportStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Report ID is required."),
  }),
  body: z.object({
    status: z.enum(["New", "Under_Review", "Resolved"]),
    vetReviewNotes: z.string().optional(),
  }),
});
