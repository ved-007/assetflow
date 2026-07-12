import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createServer } from 'http';
import { initSocket } from './lib/socket';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'Server is running' });
});

app.use(errorHandler);

initSocket(httpServer, CLIENT_URL);

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
