export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  error: any | null;
}

export interface AuthUserPayload {
  id: string;
  email: string;
  role: "farmer" | "veterinarian" | "admin";
  name: string;
}
