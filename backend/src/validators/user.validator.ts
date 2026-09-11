import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    mobile: z.string().optional(),
    villageLocation: z.string().optional(),
    preferredLanguage: z.string().optional(),
    theme: z.enum(["light", "dark", "system"]).optional(),
    highContrast: z.boolean().optional(),
  }),
});
