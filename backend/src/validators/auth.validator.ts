import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("A valid email address is required."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    role: z.preprocess(
      (val) => (typeof val === "string" ? val.toLowerCase().trim() : val),
      z.enum(["farmer", "veterinarian", "admin"])
    ).default("farmer"),
    mobile: z.string().optional(),
    villageLocation: z.string().optional(),
    preferredLanguage: z.string().optional().default("en"),
    // If vet registration
    registrationNumber: z.string().optional(),
    qualification: z.string().optional(),
    specialization: z.string().optional(),
    clinicAffiliation: z.string().optional(),
    serviceArea: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1, "Email, username, or mobile number is required."),
    password: z.string().min(1, "Password is required."),
  }),
});
