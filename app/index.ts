import bodyParser from 'body-parser';
import express from 'express';
import adsRouter from './routes/ads';
import cors from "cors";
import authRouter from './routes/auth';
import userRouter from './routes/users';
const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

app.use(adsRouter);
app.use(authRouter);
app.use(userRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
