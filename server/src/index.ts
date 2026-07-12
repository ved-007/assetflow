import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import http from 'http';
import { initSocket } from './lib/socket';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import assetsRouter from './routes/assets';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, data: { status: 'up' } });
});

app.use('/api/auth', authRouter);
app.use('/api/assets', assetsRouter);

app.use(errorHandler);

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`AssetFlow server listening on port ${PORT}`);
});
