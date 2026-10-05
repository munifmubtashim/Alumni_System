import { Request, Response } from "express";
import { AlumniManager } from "@alumni/businesslogic";
import { sendError } from "./sendError";

const alumniManager = new AlumniManager();

// The profile always belongs to the signed-in user; a user_id in the body is ignored.
export const createAlumni = async (req: Request, res: Response) => {
  try {
    const newAlumni = await alumniManager.createAlumni(Number(req.user.sub), req.body ?? {});
    res.status(201).json(newAlumni);
  } catch (error) {
    sendError(res, error);
  }
};

export const getAllAlumni = async (req: Request, res: Response) => {
  try {
    const alumni = await alumniManager.getAllAlumni();
    res.status(200).json(alumni);
  } catch (error) {
    sendError(res, error);
  }
};

export const findAlumniById = async (req: Request, res: Response) => {
  try {
    res.status(200).json(await alumniManager.findAlumniById(req.params.id));
  } catch (error) {
    sendError(res, error);
  }
};

// Owner-only (requires authMiddleware): edits the caller's own alumni row.
export const updateAlumni = async (req: Request, res: Response) => {
  try {
    const updated = await alumniManager.updateOwnAlumni(Number(req.user.sub), req.params.id, req.body ?? {});
    res.status(200).json(updated);
  } catch (error) {
    sendError(res, error);
  }
};
