const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token missing or invalid.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nestly_jwt_secret_key_2026_9981');
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { sellerProfile: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'This account has been suspended for violating community guidelines.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication Error:', error);
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions for this action.' });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};
