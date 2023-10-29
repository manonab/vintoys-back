import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface CustomRequest extends Request {
  user?: { user_id: number };
}

const secretKey = "default_secret";

export const verifyToken = (req: CustomRequest, res: Response, next: NextFunction) => {
  const token = req.header("Authorization");

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
  } catch (err: any) {
    console.error("Error while verifying token:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired." });
    }

    return res.status(400).json({ message: "Invalid token." });
  }
};

