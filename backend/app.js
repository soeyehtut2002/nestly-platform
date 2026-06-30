const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger.json');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const listingRoutes = require('./routes/listingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// 1. Enforce Helmet security headers with production-ready connectSrc dynamic whitelist
const connectSrcList = ["'self'", 'http://localhost:5001', 'ws://localhost:5001', 'https://api.cloudinary.com'];
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(origin => {
    connectSrcList.push(origin.trim());
    connectSrcList.push(origin.trim().replace(/^http/, 'ws'));
  });
}
if (process.env.BACKEND_URL) {
  connectSrcList.push(process.env.BACKEND_URL.trim());
  connectSrcList.push(process.env.BACKEND_URL.trim().replace(/^http/, 'ws'));
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://res.cloudinary.com'],
      connectSrc: connectSrcList
    }
  },
  crossOriginEmbedderPolicy: false, // Set to false to allow cross-origin images/resources from Unsplash and Cloudinary
  xFrameOptions: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// 2. Configure CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : ['http://localhost:5175', 'http://127.0.0.1:5175'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Condo-ID', 'x-condo-id'],
  credentials: true
}));

// 3. Enforce payload size limits (Mitigates DoS / Unrestricted Resource Consumption)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Swagger UI mount
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Serve frontend build static files in production if needed
if (process.env.NODE_ENV === 'production') {
  const fs = require('fs');
  const distPath = path.join(__dirname, '../frontend/dist');
  const indexPath = path.join(distPath, 'index.html');

  if (fs.existsSync(indexPath)) {
    app.use(express.static(distPath));
    app.get(/.*/, (req, res) => {
      res.sendFile(indexPath);
    });
  } else {
    // Graceful fallback for separate frontend/backend deployments
    app.get('/', (req, res) => {
      res.json({ status: 'ok', message: 'Nestly SaaS API Service active' });
    });
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  // Redact stack traces in production environment
  if (process.env.NODE_ENV === 'production') {
    console.error('Unhandled Server Error:', err.message);
    return res.status(500).json({ error: 'Something went wrong on the server.' });
  }
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

module.exports = app;
