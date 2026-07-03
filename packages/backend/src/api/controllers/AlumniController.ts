import { Request, Response } from "express";
import { AlumniManager } from "@alumni/businesslogic";
import { AlumniDTO } from "@alumni/dal";

const alumniManager = new AlumniManager();

export const createAlumni = async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      department,
      graduation_yr,
      current_company,
      job_title,
      experience,
      bio,
      linkedin_url,
    } = req.body;
    const alumni = new AlumniDTO(
      user_id,
      department,
      graduation_yr,
      current_company,
      job_title,
      experience,
      bio,
      linkedin_url,
    );
    const newAlumni = await alumniManager.createAlumni(alumni);
    res.status(201).json(newAlumni);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
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
    const alumni = await alumniManager.findAlumniById(Number(req.params.id));
    res.status(200).json(alumni);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};

export const findAlumniByEmail = async (req: Request, res: Response) => {
  try {
    const alumni = await alumniManager.findAlumniByEmail(req.params.email);
    res.status(200).json(alumni);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};

export const updateAlumni = async (req: Request, res: Response) => {
  try {
    const updated = await alumniManager.updateAlumni(
      Number(req.params.id),
      req.body,
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
