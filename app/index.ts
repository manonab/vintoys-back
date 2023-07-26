import bodyParser from 'body-parser';
import express from 'express';
import adsRouter from './routes/ads';

const app = express();
const port = 3001;

app.use(bodyParser.json());

app.use(adsRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
