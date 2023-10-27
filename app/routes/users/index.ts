import { CustomRequest, verifyToken } from "../../middleware/verifyToken";
import { Router, Response } from "express";
import { FieldPacket, RowDataPacket } from "mysql2";
import pool from "../../database";
import bcrypt from "bcryptjs";

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

userRouter.get("/users", verifyToken, async (req: CustomRequest, res: Response) => {
  try {
    const [result]: [RowDataPacket[], FieldPacket[]] =
      await pool.execute("SELECT * FROM users");
    res.status(200).json(result);
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
      return res
        .status(403)
        .json({ message: "Access denied. You can only update your own account." });
    }
    let hashedPassword = userResult[0].password;
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
});

userRouter.get("/favorites", verifyToken, async (req: CustomRequest, res: Response) => {
  const userId = req.user?.user_id;
  try {
    const [result]: [RowDataPacket[], FieldPacket[]] = await pool.execute(
      "SELECT ads.* FROM favorites INNER JOIN ads ON favorites.ad_id = ads.id WHERE favorites.user_id = ?",
      [userId],
    );

    if (result.length === 1) {
      const favorite = result[0];
      res.status(200).json(favorite);
    } else {
      res.status(204).json();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.post("/favorites", verifyToken, async (req: CustomRequest, res: Response) => {
  const userId = req.user?.user_id;
  const { adId } = req.body;

  try {
    const [adResult]: [RowDataPacket[], FieldPacket[]] = await pool.execute(
      "SELECT * FROM ads WHERE id = ?",
      [adId],
    );

    if (adResult.length === 0) {
      return res.status(404).json({ message: "Ad not found" });
    }

    const [existingFavorite]: [RowDataPacket[], FieldPacket[]] = await pool.execute(
      "SELECT * FROM favorites WHERE user_id = ? AND ad_id = ?",
      [userId, adId],
    );

    if (existingFavorite.length > 0) {
      return res.status(409).json({ message: "Ad is already in favorites" });
    }

    await pool.execute("INSERT INTO favorites (user_id, ad_id) VALUES (?, ?)", [
      userId,
      adId,
    ]);

    res.status(200).json({ message: "Ad added to favorites successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.delete(
  "/favorites/:adId",
  verifyToken,
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.user_id;
    const adId = req.params.adId;

    try {
      const [adResult]: [RowDataPacket[], FieldPacket[]] = await pool.execute(
        "SELECT * FROM ads WHERE id = ?",
        [adId],
      );

      if (adResult.length === 0) {
        return res.status(404).json({ message: "Ad not found" });
      }

      // Check if the ad is already in favorites
      const [existingFavorite]: [RowDataPacket[], FieldPacket[]] = await pool.execute(
        "SELECT * FROM favorites WHERE user_id = ? AND ad_id = ?",
        [userId, adId],
      );

      if (existingFavorite.length === 0) {
        return res.status(404).json({ message: "Ad is not in favorites" });
      }

      // Remove the favorite from the favorites table
      await pool.execute("DELETE FROM favorites WHERE user_id = ? AND ad_id = ?", [
        userId,
        adId,
      ]);

      res.status(200).json({ message: "Ad removed from favorites successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default userRouter;
