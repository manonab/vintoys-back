import express, { Request, Response, Router } from "express";
import pool from "../../database";
import { FieldPacket, RowDataPacket, ResultSetHeader } from "mysql2";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { CustomRequest, verifyToken } from "../../middleware/verifyToken";
require("dotenv").config();

const authRouter: Router = express.Router();

authRouter.post("/signin", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const [result]: [RowDataPacket[], FieldPacket[]] = await pool.execute(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );

    if (result.length === 1) {
      const user = result[0];
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        const token = jwt.sign(
          { user_id: user.user_id, user_name: user.username },
          "default_secret",
          {
            expiresIn: "1h",
          },
        );
        res.cookie("user_token", token, {
          httpOnly: true,
          expires: new Date(Date.now() + 3600000),
        });
        res.json({
          user_token: token,
          message: "Sign in successful",
        });
      } else {
        res.status(401).json({ message: "Invalid email or password" });
      }
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.get("/protected_route", verifyToken, (req: CustomRequest, res: Response) => {
  const userId = req.user?.user_id;
  console.log(userId);
  res
    .status(200)
    .json({ message: `Protected route accessed by user with ID ${userId}.` });
});

authRouter.post("/sign_up", async (req: Request, res: Response) => {
  try {
    const { username, email, password, street, postalCode, city } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const [userResult]: [ResultSetHeader, FieldPacket[]] = await pool.execute(
      "INSERT INTO users (username, email, password, street, postalCode, city) VALUES (?, ?, ?, ?, ?, ?)",
      [username, email, hashedPassword, street, postalCode, city],
    );

    const accessToken = jwt.sign(
      { user_id: userResult.insertId },
      process.env.ACCESS_TOKEN_SECRET || "default_secret",
    );
    res.json({ accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default authRouter;
