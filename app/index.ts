import express from "express";
import bodyParser from "body-parser";
import adsRouter from "./routes/ads";
import cors from "cors";
import authRouter from "./routes/auth";
import userRouter from "./routes/users";
const app = express();
const port = process.env.PORT || 3001;
app.use(bodyParser.json());
app.use(adsRouter);
app.use(authRouter);
app.use(userRouter);

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://benevolent-pixie-c8f6ac.netlify.app",
  );
  next();
});
const corsOptions = {
  origin: "https://benevolent-pixie-c8f6ac.netlify.app",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));

