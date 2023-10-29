import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import adsRouter from "./routes/ads";
import cors from "cors";
import authRouter from "./routes/auth";
import userRouter from "./routes/users";

const app = express();
const port = process.env.PORT || 3001;
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://benevolent-pixie-c8f6ac.netlify.app, http://localhost:3000",
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(cors());

app.use(adsRouter);
app.use(authRouter);
app.use(userRouter);

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
