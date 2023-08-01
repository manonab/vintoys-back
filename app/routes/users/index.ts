import { CustomRequest, verifyToken } from "../../middleware/verifyToken";
import { Router, Response } from "express";
import { FieldPacket, RowDataPacket } from "mysql2";
import pool from "../../database";

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

export default userRouter;
