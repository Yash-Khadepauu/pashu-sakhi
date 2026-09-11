import { z } from "zod";

export const createEmergencySchema = z.object({
  body: z.object({
    animalId: z.string().min(1, "Animal ID is required."),
    symptoms: z.string().min(3, "Symptoms description is required."),
    aiTriageResult: z.string().optional(),
    severity: z.enum(["moderate", "critical"]).optional().default("critical"),
    is1962HelplineInbound: z.boolean().optional().default(false),
  }),
});

export const updateEmergencyStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Emergency ID is required."),
  }),
  body: z.object({
    status: z.enum(["new", "accepted", "inTreatment", "resolved"]),
    assignedVetId: z.string().optional(),
  }),
});
