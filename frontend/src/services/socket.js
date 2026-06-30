import { io } from 'socket.io-client';

let socket = null;

export const initSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  if (socket) {
    socket.disconnect();
  }

  const socketHost = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
  socket = io(socketHost, {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('Socket.io connection established');
  });

  socket.on('disconnect', () => {
    console.log('Socket.io connection closed');
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
