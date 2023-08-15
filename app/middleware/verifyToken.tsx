import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface CustomRequest extends Request {
  user?: { user_id: number };
}
const secretKey = "default_secret";

export const verifyToken = (req: CustomRequest, res: Response, next: NextFunction) => {
  const token = req.header("Authorization");

  console.log("Token from header:", token);

  if (!token) {
    return res.status(401).json({ message: "Access denied. Token missing." });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), secretKey) as {
      user_id: number;
    };

    console.log("Decoded token:", decoded);

    req.user = decoded;
    next();
  } catch (err) {
    console.error("Error while verifying token:", err);
    return res.status(400).json({ message: "Invalid token." });
  }
};
