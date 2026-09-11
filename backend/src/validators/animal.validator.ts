import { z } from "zod";

export const createAnimalSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Animal name is required."),
    species: z.string().min(1, "Species is required."), // e.g. Cow, Buffalo, Goat, Sheep, Chicken
    breed: z.string().default("Indigenous"),
    ageYears: z.number().min(0, "Age must be non-negative."),
    gender: z.enum(["Female", "Male"]),
    earTag: z.string().optional(),
    healthStatus: z.enum(["healthy", "attention", "urgent"]).optional().default("healthy"),
    vaccinationName: z.string().optional(),
    vaccinationDueDate: z.string().optional(), // ISO date string
  }),
});

export const updateAnimalSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Animal ID is required."),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    species: z.string().min(1).optional(),
    breed: z.string().optional(),
    ageYears: z.number().min(0).optional(),
    gender: z.enum(["Female", "Male"]).optional(),
    earTag: z.string().optional(),
    healthStatus: z.enum(["healthy", "attention", "urgent"]).optional(),
  }),
});
