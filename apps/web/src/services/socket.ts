import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to Scan & Dine Live Socket:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from Live Socket');
    });
  }
  return socket;
};
