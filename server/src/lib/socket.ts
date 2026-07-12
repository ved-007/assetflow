import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken, JwtPayload } from './jwt';
import cookie from 'cookie';

let io: SocketIOServer;

export function initSocket(server: HttpServer, clientUrl: string) {
  io = new SocketIOServer(server, {
    cors: {
      origin: clientUrl,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || '');
      const token = cookies.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const payload = verifyToken(token);
      socket.data.user = payload;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as JwtPayload;
    if (user && user.id) {
      socket.join(`user:${user.id}`);
    }
  });
}

export function emitToUser(userId: number, event: string, payload: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, payload);
  }
}
