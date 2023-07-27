import pool from "../../database";
import { Router, Request, Response } from "express";
import { FieldPacket, RowDataPacket, ResultSetHeader } from "mysql2";

const adsRouter = Router();

adsRouter.post("/ads", async (req: Request, res: Response) => {
  try {
    const { title, description, price, category, images } = req.body;

    if (!title || !description || !price || !category) {
      return res.status(400).json({ message: "Please provide all the required values." });
    }

    // Get the thumbnail URL from the first image, or use the default URL if no images are provided
    const thumbnailUrl =
      images && images.length > 0 ? images[0].url : "url_de_l_image_par_defaut.jpg";

    const [adResult]: [ResultSetHeader, FieldPacket[]] = await pool.execute(
      "INSERT INTO ads (title, description, price, category, thumbnail_url) VALUES (?, ?, ?, ?, ?)",
      [title, description, price, category, thumbnailUrl],
    );

    const connection = await pool.getConnection();
    const adId = adResult.insertId;

    if (images && Array.isArray(images)) {
      const imageQuery = "INSERT INTO images (ad_id, url) VALUES (?, ?)";
      for (const imageUrl of images) {
        const imageValues = [adId, imageUrl.url]; // Use imageUrl.url instead of imageUrl
        await connection.query(imageQuery, imageValues);
      }
    }

    connection.release();

    res.status(201).json({ message: "Ad created successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

adsRouter.get("/ads", async (_req: Request, res: Response) => {
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
      title: ad.title,
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

adsRouter.get("/ads/:id", async (req: Request, res: Response) => {
  const adId = req.params.id;

  try {
    // Fetch ad details from the database
    const adQuery = "SELECT * FROM ads WHERE id = ?";
    const connection = await pool.getConnection();
    const [adResults] = (await connection.query(adQuery, [adId])) as RowDataPacket[];
    connection.release();

    if (adResults.length === 0) {
      return res.status(404).json({ message: "Ad not found." });
    }

    const ad = adResults[0];

    // Fetch images associated with the ad from the database
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
