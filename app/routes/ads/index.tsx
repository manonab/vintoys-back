import pool from "../../database";
import { Router, Request, Response } from "express";

const adsRouter = Router();

adsRouter.post("/ads", async (req: Request, res: Response) => {
  try {
    const { title, description, price } = req.body;

    // Check if all required values are provided in the request
    if (!title || !description || !price) {
      return res.status(400).json({ message: "Please provide all the required values." });
    }

    // Insert values into the database
    const query = "INSERT INTO ads (title, description, price) VALUES (?, ?, ?)";
    const values = [title, description, price];

    const connection = await pool.getConnection();
    await connection.query(query, values);
    connection.release();

    res.status(201).json({ message: "Ad created successfully." });
  } catch (error: any) {
    console.error("Error while inserting ad:", error);
    res
      .status(500)
      .json({ message: "Server error while creating the ad.", error: error.message });
  }
});

adsRouter.get("/ads", async (_req: Request, res: Response) => {
  try {
    // Fetch ads from the database
    const query = "SELECT * FROM ads";
    const connection = await pool.getConnection();
    const [ads] = await connection.query(query);
    connection.release();

    // Send the ads as a JSON response
    res.status(200).json(ads);
  } catch (error) {
    console.error("Error while fetching ads:", error);
    res.status(500).json({ message: "Server error while fetching ads." });
  }
});
export default adsRouter;
