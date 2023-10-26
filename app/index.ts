import express from "express";
import bodyParser from "body-parser";
import adsRouter from "./routes/ads";
import cors from "cors";
import authRouter from "./routes/auth";
import userRouter from "./routes/users";
const app = express();
const port = process.env.PORT || 3001;
app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(adsRouter);
app.use(authRouter);
app.use(userRouter);

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});

app.use(
  cors({
    origin: "https://benevolent-pixie-c8f6ac.netlify.app/",
  }),
);
