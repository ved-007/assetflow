import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import cookie from 'cookie';
import { verifyToken } from './jwt';

let io: Server | undefined;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;
      if (!rawCookie) {
        return next(new Error('Unauthorized'));
      }

      const parsed = cookie.parse(rawCookie);
      const token = parsed.token;
      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const payload = verifyToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user?.id;
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  return io;
}

export function getIo(): Server {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
}

export function emitToUser(userId: number, event: string, payload: unknown): void {
  getIo().to(`user:${userId}`).emit(event, payload);
}
