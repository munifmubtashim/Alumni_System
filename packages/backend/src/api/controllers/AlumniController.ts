import { Request, Response } from "express";
import { AlumniManager, AppError } from "@alumni/businesslogic";

const alumniManager = new AlumniManager();

// The profile always belongs to the signed-in user; a user_id in the body is ignored.
export const createAlumni = async (req: Request, res: Response) => {
  try {
    const newAlumni = await alumniManager.createAlumni(Number(req.user.sub), req.body ?? {});
    res.status(201).json(newAlumni);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getAllAlumni = async (req: Request, res: Response) => {
  try {
    const alumni = await alumniManager.getAllAlumni();
    res.status(200).json(alumni);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const findAlumniById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const alumni = Number.isInteger(id) ? await alumniManager.findAlumniById(id) : undefined;
    if (!alumni) return res.status(404).json({ error: "Alumni not found" });
    res.status(200).json(alumni);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};

// Owner-only (requires authMiddleware): edits the caller's own alumni row.
export const updateAlumni = async (req: Request, res: Response) => {
  try {
    const updated = await alumniManager.updateOwnAlumni(Number(req.user.sub), req.params.id, req.body ?? {});
    res.status(200).json(updated);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: "Something went wrong" });
  }
};
