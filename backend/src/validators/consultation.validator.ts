import { z } from "zod";

export const createConsultationSchema = z.object({
  body: z.object({
    animalId: z.string().min(1, "Animal ID is required."),
    symptomsSummary: z.string().min(5, "Symptoms summary must be at least 5 characters."),
    imageUrl: z.string().url().optional(),
    priority: z.enum(["low", "moderate", "high", "critical"]).optional().default("moderate"),
    assignedVetId: z.string().optional(),
  }),
});

export const updateConsultationStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Consultation ID is required."),
  }),
  body: z.object({
    status: z.enum(["new", "unread", "waiting", "inConsultation", "resolved"]),
    assignedVetId: z.string().optional(),
  }),
});

export const createChatMessageSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Consultation ID is required."),
  }),
  body: z.object({
    messageText: z.string().min(1, "Message text is required."),
    category: z.string().optional().default("general"),
  }),
});
