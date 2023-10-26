import bodyParser from 'body-parser';
import express from 'express';
import adsRouter from './routes/ads';
import cors from "cors";
import authRouter from './routes/auth';
import userRouter from './routes/users';
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(adsRouter);
app.use(authRouter);
app.use(userRouter);

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
