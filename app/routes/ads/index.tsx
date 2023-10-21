import { FieldPacket, RowDataPacket, ResultSetHeader } from "mysql2";
import { Router, Request, Response } from "express";
import pool from "../../database";
import { CustomRequest, verifyToken } from "../../middleware/verifyToken";

const adsRouter = Router();

adsRouter.post("/ads", verifyToken, async (req: CustomRequest, res: Response) => {
  try {
    const seller_id = req.user?.user_id;
    const {
      title,
      description,
      sub_category,
      age_range,
      category,
      price,
      brand,
      location,
      state,
      status,
      images,
    } = req.body;
    if (
      !title ||
      !description ||
      !sub_category ||
      !age_range ||
      !category ||
      !price ||
      !brand ||
      !location ||
      !state ||
      !status
    ) {
      return res.status(400).json({ message: "Please provide all the required values." });
    }

    const thumbnailUrl =
      images && images.length > 0 ? images[0].url : "url_de_l_image_par_defaut.jpg";

    const query = `
      INSERT INTO ads (seller_id, title, description, sub_category, age_range, category, price, brand, location, state, status, thumbnail_url,updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [adResult]: [ResultSetHeader, FieldPacket[]] = await pool.execute(query, [
      seller_id,
      title,
      description,
      category,
      age_range,
      sub_category,
      price,
      brand,
      location,
      state,
      status,
      thumbnailUrl,
    ]);

    const adId = adResult.insertId;
    if (images && Array.isArray(images)) {
      const imageQuery = "INSERT INTO images (ad_id, data) VALUES (?, ?)";
      for (const image of images) {
        const imageValues = [adId, image.data];
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
    SELECT ads.*, images.data as image_data, users.username, users.profile_photo
    FROM ads
    LEFT JOIN images ON ads.id = images.ad_id
    LEFT JOIN users ON ads.seller_id = users.user_id
    `;
    const connection = await pool.getConnection();
    const [adsWithThumbnails] = await connection.query(query);
    connection.release();

    const ads = (adsWithThumbnails as RowDataPacket[]).map((ad) => ({
      id: ad.id,
      title: ad.title,
      brand: ad.brand,
      seller_id: ad.seller_id,
      username: ad.username,
      profile_photo: ad.profile_photo,
      location: ad.location,
      description: ad.description,
      price: ad.price,
      state: ad.state,
      created_at: ad.created_at,
      category: ad.category,
      time_ago: getTimeAgo(ad.created_at),
      thumbnail_url: ad.image_data ? `data:image/jpeg;base64,${ad.image_data.toString("base64")}` : "url_de_l_image_par_defaut.jpg",
    }));

    res.status(200).json(ads);
  } catch (error) {
    console.error("Error while fetching ads:", error);
    res.status(500).json({ message: "Server error while fetching ads." });
  }
});

adsRouter.get("/ads/children", async (req: Request, res: Response) => {
  try {
    const query = `
    SELECT ads.*, images.url as thumbnail_url, users.username, users.profile_photo
    FROM ads
    LEFT JOIN images ON ads.id = images.ad_id
    LEFT JOIN users ON ads.seller_id = users.user_id
    WHERE ads.category = 2
    `;
    const connection = await pool.getConnection();
    const [adsWithThumbnails] = await connection.query(query);
    connection.release();

    const ads = (adsWithThumbnails as RowDataPacket[]).map((ad) => ({
      id: ad.id,
      title: ad.title,
      brand: ad.brand,
      seller_id: ad.seller_id,
      seller_username: ad.username,
      seller_profile_photo: ad.profile_photo,
      location: ad.location,
      description: ad.description,
      price: ad.price,
      state: ad.state,
      created_at: ad.created_at,
      category: ad.category,
      time_ago: getTimeAgo(ad.created_at),
      thumbnail_url: ad.thumbnail_url || "url_de_l_image_par_defaut.jpg",
    }));

    console.log(ads);
    res.status(200).json(ads);
  } catch (error) {
    console.error("Error while fetching ads:", error);
    res.status(500).json({ message: "Server error while fetching ads." });
  }
});

adsRouter.get("/ads/adult", async (req: Request, res: Response) => {
  try {
    const query = `
    SELECT ads.*, images.url as thumbnail_url, users.username, users.profile_photo
    FROM ads
    LEFT JOIN images ON ads.id = images.ad_id
    LEFT JOIN users ON ads.seller_id = users.user_id
    WHERE ads.category = 1
    `;
    const connection = await pool.getConnection();
    const [adsWithThumbnails] = await connection.query(query);
    connection.release();

    const ads = (adsWithThumbnails as RowDataPacket[]).map((ad) => ({
      id: ad.id,
      title: ad.title,
      brand: ad.brand,
      seller_id: ad.seller_id,
      seller_username: ad.username,
      seller_profile_photo: ad.profile_photo,
      location: ad.location,
      description: ad.description,
      price: ad.price,
      state: ad.state,
      created_at: ad.created_at,
      category: ad.category,
      time_ago: getTimeAgo(ad.created_at),
      thumbnail_url: ad.thumbnail_url || "url_de_l_image_par_defaut.jpg",
    }));

    console.log(ads);
    res.status(200).json(ads);
  } catch (error) {
    console.error("Error while fetching ads:", error);
    res.status(500).json({ message: "Server error while fetching ads." });
  }
});

adsRouter.get("/ads/vintage", async (req: Request, res: Response) => {
  try {
    const query = `
    SELECT ads.*, images.url as thumbnail_url, users.username, users.profile_photo
    FROM ads
    LEFT JOIN images ON ads.id = images.ad_id
    LEFT JOIN users ON ads.seller_id = users.user_id
    WHERE ads.category = 3
    `;
    const connection = await pool.getConnection();
    const [adsWithThumbnails] = await connection.query(query);
    connection.release();

    const ads = (adsWithThumbnails as RowDataPacket[]).map((ad) => ({
      id: ad.id,
      title: ad.title,
      brand: ad.brand,
      seller_id: ad.seller_id,
      seller_username: ad.username,
      seller_profile_photo: ad.profile_photo,
      location: ad.location,
      description: ad.description,
      price: ad.price,
      state: ad.state,
      created_at: ad.created_at,
      category: ad.category,
      time_ago: getTimeAgo(ad.created_at),
      thumbnail_url: ad.thumbnail_url || "url_de_l_image_par_defaut.jpg",
    }));

    console.log(ads);
    res.status(200).json(ads);
  } catch (error) {
    console.error("Error while fetching ads:", error);
    res.status(500).json({ message: "Server error while fetching ads." });
  }
});

adsRouter.get("/my_ads", verifyToken, async (req: CustomRequest, res: Response) => {
  try {
    const seller_id = req.user?.user_id;

    const query = `
      SELECT ads.*, images.url as thumbnail_url
      FROM ads
      LEFT JOIN images ON ads.id = images.ad_id
      WHERE ads.seller_id = ?
    `;

    const connection = await pool.getConnection();
    const [adsWithThumbnails] = await connection.query(query, [seller_id]);
    connection.release();
    const ads = (adsWithThumbnails as RowDataPacket[]).map((ad) => ({
      id: ad.id,
      seller_id: ad.seller_id,
      brand: ad.brand,
      location: ad.location,
      description: ad.description,
      price: ad.price,
      title: ad.title,
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
    const adQuery = `SELECT ads.*, users.username, users.profile_photo FROM ads 
      LEFT JOIN users ON ads.seller_id = users.user_id
      WHERE ads.id = ?`; // Ajout de "WHERE ads.id = ?" pour filtrer par l'ID de l'annonce
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
