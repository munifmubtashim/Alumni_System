import type { Response } from "express";
import { AppError } from "@alumni/businesslogic";

// Shared AppError-to-HTTP mapping for controllers, until the error-middleware REQ replaces it.
// Unknown errors become a plain 500: raw error text (pg messages etc.) never reaches the client.
export function sendError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.status).json({ message: error.message });
  }
  return res.status(500).json({ message: "Something went wrong" });
}
