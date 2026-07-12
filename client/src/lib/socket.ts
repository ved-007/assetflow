import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000', {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
};
