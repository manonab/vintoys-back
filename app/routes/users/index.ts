import { CustomRequest, verifyToken } from "../../middleware/verifyToken";
import { Router, Response } from "express";
import { FieldPacket, RowDataPacket } from "mysql2";
import pool from "../../database";
import bcrypt from "bcrypt";

const userRouter = Router();

userRouter.get("/me", verifyToken, async (req: CustomRequest, res: Response) => {
     const userId = req.user?.user_id;
   
     try {
       const [result]: [RowDataPacket[], FieldPacket[]] = await pool.execute(
         "SELECT * FROM users WHERE user_id = ?",
         [userId],
       );
   
       if (result.length === 1) {
         const user = result[0];
         res.status(200).json(user);
       } else {
         res.status(404).json({ message: "User not found" });
       }
     } catch (error) {
       console.error(error);
       res.status(500).json({ message: "Internal server error" });
     }
});

userRouter.put("/profile", verifyToken, async (req: CustomRequest, res: Response) => {
     const userId = req.user?.user_id;
     const { username, email, password } = req.body;

     if (!username && !email && !password) {
          return res.status(400).json({ message: "No updates provided" });
     }
  try {
    const [userResult]: [RowDataPacket[], FieldPacket[]] = await pool.execute(
      "SELECT * FROM users WHERE user_id = ?",
      [userId],
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const [existingUser]: [RowDataPacket[], FieldPacket[]] = await pool.execute(
      "SELECT * FROM users WHERE email = ? AND user_id <> ?",
      [email, userId],
    );
 
    if (existingUser.length > 0) {
      return res.status(409).json({ message: "Email already in use by another user" });
    }
    if (userId !== userResult[0].user_id) {
     return res.status(403).json({ message: "Access denied. You can only update your own account." });
   }
    let hashedPassword = userResult[0].password; // conserver le mot de passe actuel s'il n'est pas modifié
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    await pool.execute(
      "UPDATE users SET username = ?, email = ?, password = ? WHERE user_id = ?",
      [username, email, hashedPassword, userId],
    );

    res.status(200).json({ message: "Account updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
})

export default userRouter;
