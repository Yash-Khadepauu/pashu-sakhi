export const ROLES = {
  FARMER: "farmer",
  VETERINARIAN: "veterinarian",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
