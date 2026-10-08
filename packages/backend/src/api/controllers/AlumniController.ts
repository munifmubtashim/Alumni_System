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

// Searched, filtered, paged directory list: 200 { items, total }. Bad query input is a 400.
export const searchAlumni = async (req: Request, res: Response) => {
  try {
    res.status(200).json(await alumniManager.searchAlumni(req.query));
  } catch (error) {
    sendError(res, error);
  }
};

// Up to 5 other alumni for the signed-in user (any role): 200 with a bare array, [] when none.
export const suggestAlumni = async (req: Request, res: Response) => {
  try {
    res.status(200).json(await alumniManager.suggestAlumni(Number(req.user.sub)));
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
