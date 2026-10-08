import { Request, Response } from "express";
import { AdminManager } from "@alumni/businesslogic";
import { sendError } from "./sendError";

const adminManager = new AdminManager();

// Every handler here sits behind authMiddleware + requireRole("admin") (AdminRoutes.ts).

export const getStats = async (req: Request, res: Response) => {
  try {
    res.status(200).json(await adminManager.getStats());
  } catch (error) {
    sendError(res, error);
  }
};

// 201 with the new alumni row (id = alumni id).
export const createAlumni = async (req: Request, res: Response) => {
  try {
    res.status(201).json(await adminManager.createAlumni(req.body ?? {}));
  } catch (error) {
    sendError(res, error);
  }
};

// :id is the alumni id. 200 with the updated alumni row.
export const updateAlumni = async (req: Request, res: Response) => {
  try {
    res.status(200).json(await adminManager.updateAlumni(req.params.id, req.body ?? {}));
  } catch (error) {
    sendError(res, error);
  }
};

// :id is the alumni id. The admin's own user id comes from the token, so they can't delete themselves.
export const deleteAlumni = async (req: Request, res: Response) => {
  try {
    await adminManager.deleteAlumni(Number(req.user.sub), req.params.id);
    res.status(200).json({ message: "Alumni deleted" });
  } catch (error) {
    sendError(res, error);
  }
};
