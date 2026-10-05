import { Request, Response, NextFunction } from "express";

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // No signed-in user means authMiddleware didn't run: a token problem, so 401 (not 403).
    if (!req.user) {
      return res.status(401).json({ message: "Not signed in" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
