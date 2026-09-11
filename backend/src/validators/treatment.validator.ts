import { z } from "zod";

export const createTreatmentSchema = z.object({
  body: z.object({
    animalId: z.string().min(1, "Animal ID is required."),
    conditionDiagnosed: z.string().min(2, "Condition diagnosed is required."),
    medicinePrescribed: z.string().optional(),
    dosage: z.string().optional(),
    route: z.string().optional(),
    duration: z.string().optional(),
    clinicalNotes: z.string().optional(),
    startDate: z.string().optional(),
    followUpDate: z.string().optional(),
  }),
});

export const updateTreatmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Treatment ID is required."),
  }),
  body: z.object({
    conditionDiagnosed: z.string().optional(),
    medicinePrescribed: z.string().optional(),
    dosage: z.string().optional(),
    route: z.string().optional(),
    duration: z.string().optional(),
    clinicalNotes: z.string().optional(),
    followUpDate: z.string().optional(),
    status: z.enum(["active", "completed", "discontinued"]).optional(),
  }),
});
