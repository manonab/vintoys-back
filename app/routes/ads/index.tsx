import { FieldPacket, RowDataPacket, ResultSetHeader } from "mysql2";
import { Router, Request, Response } from "express";
import pool from "../../database";
import { CustomRequest, verifyToken } from "../../middleware/verifyToken";

const adsRouter = Router();

adsRouter.post("/ads", verifyToken, async (req: CustomRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const {
      title,
      description,
      price,
      category,
      images,
      location,
      seller_email,
      seller_name,
      seller_phone,
      is_vintage,
      brand,
    } = req.body;

    if (
      !title ||
      !description ||
      !price ||
      !category ||
      !location ||
      !seller_email ||
      !seller_name ||
      !seller_phone ||
      !is_vintage ||
      !brand
    ) {
      return res.status(400).json({ message: "Please provide all the required values." });
    }

    const thumbnailUrl =
      images && images.length > 0 ? images[0].url : "url_de_l_image_par_defaut.jpg";

    const query = `
      INSERT INTO ads (user_id,title, description, price, category, thumbnail_url, location, seller_email, seller_name, seller_phone, is_vintage, brand, updated_at)
      VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [adResult]: [ResultSetHeader, FieldPacket[]] = await pool.execute(query, [
      user_id,
      title,
      description,
      price,
      category,
      thumbnailUrl,
      location,
      seller_email,
      seller_name,
      seller_phone,
      is_vintage,
      brand,
    ]);

    const adId = adResult.insertId;

    if (images && Array.isArray(images)) {
      const imageQuery = "INSERT INTO images (ad_id, url) VALUES (?, ?)";
      for (const imageUrl of images) {
        const imageValues = [adId, imageUrl.url];
        await pool.execute(imageQuery, imageValues);
      }
    }

    res.status(201).json({ message: "Ad created successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

adsRouter.get("/ads", async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT ads.*, images.url as thumbnail_url
      FROM ads
      LEFT JOIN images ON ads.id = images.ad_id
    `;
    const connection = await pool.getConnection();
    const [adsWithThumbnails] = await connection.query(query);
    connection.release();

    // Type assertion to ensure adsWithThumbnails is of type RowDataPacket[]
    const ads = (adsWithThumbnails as RowDataPacket[]).map((ad) => ({
      id: ad.id,
      is_vintage: ad.is_vintage,
      seller_phone: ad.seller_phone,
      seller_name: ad.seller_name,
      brand: ad.brand,
      user_id: ad.user_id,
      location: ad.location,
      seller_email: ad.seller_email,
      description: ad.description,
      price: ad.price,
      state: ad.state,
      created_at: ad.created_at,
      category: ad.category,
      time_ago: getTimeAgo(ad.created_at),
      thumbnail_url: ad.thumbnail_url || "url_de_l_image_par_defaut.jpg", // Use the default URL if thumbnail_url is null
    }));

    res.status(200).json(ads);
  } catch (error) {
    console.error("Error while fetching ads:", error);
    res.status(500).json({ message: "Server error while fetching ads." });
  }
});

adsRouter.get("/my_ads", verifyToken, async (req: CustomRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;

    const query = `
      SELECT ads.*, images.url as thumbnail_url
      FROM ads
      LEFT JOIN images ON ads.id = images.ad_id
      WHERE ads.user_id = ?
    `;

    const connection = await pool.getConnection();
    const [adsWithThumbnails] = await connection.query(query, [user_id]);
    connection.release();

    const ads = (adsWithThumbnails as RowDataPacket[]).map((ad) => ({
      id: ad.id,
      is_vintage: ad.is_vintage,
      seller_phone: ad.seller_phone,
      seller_name: ad.seller_name,
      brand: ad.brand,
      user_id: ad.user_id,
      location: ad.location,
      seller_email: ad.seller_email,
      description: ad.description,
      price: ad.price,
      state: ad.state,
      created_at: ad.created_at,
      category: ad.category,
      time_ago: getTimeAgo(ad.created_at),
      thumbnail_url: ad.thumbnail_url || "url_de_l_image_par_defaut.jpg",
    }));

    res.status(200).json(ads);
  } catch (error) {
    console.error("Error while fetching user ads:", error);
    res.status(500).json({ message: "Server error while fetching user ads." });
  }
});
adsRouter.get("/ads/:id", async (req: Request, res: Response) => {
  const adId = req.params.id;

  try {
    const adQuery = "SELECT * FROM ads WHERE id = ?";
    const connection = await pool.getConnection();
    const [adResults] = (await connection.query(adQuery, [adId])) as RowDataPacket[];
    connection.release();

    if (adResults.length === 0) {
      return res.status(404).json({ message: "Ad not found." });
    }

    const ad = adResults[0];

    const imageQuery = "SELECT * FROM images WHERE ad_id = ?";
    const [imageResults] = (await connection.query(imageQuery, [
      adId,
    ])) as RowDataPacket[];

    const images = imageResults.map((imageResult: RowDataPacket) => imageResult.url);

    ad.images = images;

    res.status(200).json(ad);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

adsRouter.put(
  "/update_ads/:id",
  verifyToken,
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.user_id;
    const adId = req.params.id;

    try {
      const [adResult]: [RowDataPacket[], FieldPacket[]] = await pool.execute(
        "SELECT * FROM ads WHERE id = ? AND user_id = ?",
        [adId, userId],
      );

      if (adResult.length === 0) {
        return res
          .status(404)
          .json({ message: "Ad not found or you are not authorized to update it" });
      }

      const { title, description, price, category, images, location, is_vintage, brand } =
        req.body;

      if (
        !title ||
        !description ||
        !price ||
        !category ||
        !location ||
        !is_vintage ||
        !brand
      ) {
        return res
          .status(400)
          .json({ message: "Please provide all the required values." });
      }

      // Mettre à jour l'annonce dans la base de données
      const thumbnailUrl =
        images && images.length > 0 ? images[0].url : "url_de_l_image_par_defaut.jpg";
      const updateQuery = `
      UPDATE ads
      SET title = ?, description = ?, price = ?, category = ?, thumbnail_url = ?, location = ?, is_vintage = ?, brand = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `;
      await pool.execute(updateQuery, [
        title,
        description,
        price,
        category,
        thumbnailUrl,
        location,
        is_vintage,
        brand,
        adId,
        userId,
      ]);

      await pool.execute("DELETE FROM images WHERE ad_id = ?", [adId]);

      if (images && Array.isArray(images)) {
        const imageQuery = "INSERT INTO images (ad_id, url) VALUES (?, ?)";
        for (const imageUrl of images) {
          const imageValues = [adId, imageUrl.url];
          await pool.execute(imageQuery, imageValues);
        }
      }

      res.status(200).json({ message: "Ad updated successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

adsRouter.delete("/ads/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const adId = req.params.id;

    // Vérifiez si l'annonce avec l'ID donné existe dans la base de données
    const [ads]: [RowDataPacket[], FieldPacket[]] = await pool.execute(
      "SELECT * FROM ads WHERE id = ?",
      [adId],
    );

    if (ads.length === 0) {
      return res.status(404).json({ message: "Ad not found" });
    }

    // Vérifiez si l'utilisateur connecté est le propriétaire de l'annonce (ou a les autorisations appropriées pour supprimer l'annonce)
    // Vous pouvez implémenter la logique pour vérifier cela en fonction de votre système d'authentification et des autorisations des utilisateurs

    // Supprimez l'annonce de la base de données
    await pool.execute("DELETE FROM ads WHERE id = ?", [adId]);

    res.status(200).json({ message: "Ad deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting the ad" });
  }
});
function getTimeAgo(timestamp: string): string {
  const currentTime = Date.now();
  const adTime = Date.parse(timestamp);
  const timeDifferenceMs = currentTime - adTime;

  const seconds = Math.floor(timeDifferenceMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  } else {
    return `${seconds} second${seconds === 1 ? "" : "s"} ago`;
  }
}

export default adsRouter;
