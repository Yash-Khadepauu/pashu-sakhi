import { AuthUserPayload } from "./api";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}
