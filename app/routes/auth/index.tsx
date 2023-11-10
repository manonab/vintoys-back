import express, { Request, Response, Router } from "express";
import pool from "../../database";
import { FieldPacket, RowDataPacket, ResultSetHeader } from "mysql2";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { CustomRequest, verifyToken } from "../../middleware/verifyToken";
require("dotenv").config();

const authRouter: Router = express.Router();

authRouter.post("/refresh", async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ message: "User ID missing." });
  }

  try {
    const [result]: [RowDataPacket[], FieldPacket[]] = await pool.execute(
      "SELECT * FROM users WHERE user_id = ?",
      [user_id],
    );

    if (result.length === 1) {
      const user = result[0];
      if (user.refresh_token) {
        const accessToken = jwt.sign(
          { user_id: user.user_id, user_name: user.username },
          `${process.env.ACCESS_TOKEN_SECRET}`,
          {
            expiresIn: "1h",
          }
        );

        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization');
        res.json({ accessToken: accessToken });
      } else {
        res.status(401).json({ message: "Invalid refresh token" });
      }
    } else {
      res.status(401).json({ message: "Invalid user ID" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.post("/signin", async (req, res) => {
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
        const accessToken = jwt.sign(
          { user_id: user.user_id, user_name: user.username },
          `${process.env.ACCESS_TOKEN_SECRET}`,
          {
            expiresIn: "1h",
          },
        );

        const refreshToken = jwt.sign(
          { user_id: user.user_id },
          `${process.env.REFRESH_TOKEN_SECRET}`,
          {
            expiresIn: "7d",
          }
        );

        const insertRefreshTokenQuery = "UPDATE users SET refresh_token = ? WHERE user_id = ?";
        const user_id = user.user_id;
        await pool.execute(insertRefreshTokenQuery, [refreshToken, user_id]);

        res.cookie("user_token", accessToken, {
          httpOnly: true,
          expires: new Date(Date.now() + 3600000),
        });

        res.json({
          user_token: accessToken,
          refreshToken: refreshToken,
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
    if (
      !username ||
      !email ||
      !password ||
      !street ||
      !postalCode ||
      !city
    ) {
      return res.status(400).json({ message: "Merci de remplir tous les champs" });
    }
    const [result]: [RowDataPacket[], FieldPacket[]] = await pool.execute(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );
    if (result.length > 0) {
      return res.status(409).json({ message: "Cette adresse e-mail est déjà utilisée." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

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
