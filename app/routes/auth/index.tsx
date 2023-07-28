import express, { Request, Response, Router } from "express";
import pool from "../../database";
import { FieldPacket, RowDataPacket, ResultSetHeader } from "mysql2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
require("dotenv").config();

const authRouter: Router = express.Router();

authRouter.post("/signin", async (req: Request, res: Response) => {
  // extract email and password from request body
  try {
    const { email, password } = req.body;
    const [result]: [RowDataPacket[], FieldPacket[]] = await pool.execute(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );

    if (result.length === 1) {
      const user = result[0];
      const accessToken = jwt.sign(
        { userId: user.id },
        process.env.ACCESS_TOKEN_SECRET ?? "default_secret",
      );
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        res.status(200).json({
          message: "Sign in successful",
          user_id: user.id,
          user_token: accessToken,
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

authRouter.post("/sign_up", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const [userResult]: [ResultSetHeader, FieldPacket[]] = await pool.execute(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword],
    );

    const accessToken = jwt.sign(
      { userId: userResult.insertId },
      process.env.ACCESS_TOKEN_SECRET ?? "default_secret",
    );
    res.json({ userId: userResult.insertId, accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default authRouter;
