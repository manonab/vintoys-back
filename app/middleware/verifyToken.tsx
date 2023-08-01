import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface CustomRequest extends Request {
  user?: { user_id: number };
}
const secretKey = "votre_secret_ici";

export const verifyToken = (req: CustomRequest, res: Response, next: NextFunction) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Access denied. Token missing." });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), secretKey) as {
      user_id: number;
    };
    req.user = decoded; // Stocker les données du token dans req.user
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid token." });
  }
};
