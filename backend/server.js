require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const prisma = require('./config/db');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5175', 'http://127.0.0.1:5175'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Authentication middleware for Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication error: Token missing.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nestly_jwt_secret_key_2026_9981');
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    return next(new Error('Authentication error: Invalid token.'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected to Socket.io. User ID: ${socket.userId}`);

  // Join personal notification channel room
  socket.join(`user_${socket.userId}`);

  // Join a specific chat conversation room
  socket.on('join_chat', ({ chatId }) => {
    socket.join(`chat_${chatId}`);
    console.log(`User ${socket.userId} joined room: chat_${chatId}`);
  });

  // Handle sending message
  socket.on('send_message', async ({ chatId, messageText }) => {
    try {
      if (!chatId || !messageText) return;

      // Save message to database
      const message = await prisma.message.create({
        data: {
          chatId: chatId,
          senderId: socket.userId,
          messageText
        },
        include: {
          sender: { select: { id: true, fullName: true } }
        }
      });

      // Broadcast message to everyone in room (both sender and receiver)
      io.to(`chat_${chatId}`).emit('receive_message', message);
      console.log(`Message broadcast in chat_${chatId}: ${messageText}`);
    } catch (error) {
      console.error('Socket message save/broadcast error:', error);
      socket.emit('error', { message: 'Failed to send message.' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected. User ID: ${socket.userId}`);
  });
});

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Nestly Backend running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` PostgreSQL synced and active`);
  console.log(` Real-time Socket.io channels active`);
  console.log(`=================================================`);
});
