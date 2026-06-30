const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/db');
const emailService = require('../services/emailService');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// Generate access token
const generateAccessToken = (userId, role, condoId) => {
  return jwt.sign(
    { id: userId, role, condoId },
    process.env.JWT_SECRET || 'nestly_jwt_secret_key_2026_9981',
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

// Generate refresh token and save to DB
const generateAndSaveRefreshToken = async (userId) => {
  const tokenString = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  const refreshToken = await prisma.refreshToken.create({
    data: {
      token: tokenString,
      userId,
      expiresAt
    }
  });

  return refreshToken.token;
};

// Public endpoint to retrieve all active condos
const getCondos = async (req, res) => {
  try {
    const condos = await prisma.condominium.findMany({
      where: { isActive: true },
      select: { id: true, name: true, address: true, province: true }
    });
    return res.json(condos);
  } catch (error) {
    console.error('Fetch Condos Error:', error);
    return res.status(500).json({ error: 'Internal server error fetching condominiums.' });
  }
};

const register = async (req, res) => {
  try {
    const { email, password, fullName, roomNumber, phoneNumber, pdpaConsent } = req.body;
    const condoId = req.condoId; // Injected by tenantMiddleware

    if (!email || !password || !fullName || !roomNumber) {
      return res.status(400).json({ error: 'All fields (email, password, fullName, roomNumber) are required.' });
    }

    if (!pdpaConsent) {
      return res.status(400).json({ error: 'You must consent to the PDPA terms to register.' });
    }

    // Verify user doesn't already exist
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email address already registered.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Hash password using Argon2id
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    // If first user, make SYSTEM_ADMIN, otherwise RESIDENT
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'SYSTEM_ADMIN' : 'RESIDENT';

    // Create user scoped with condoId (unverified by default)
    const user = await prisma.user.create({
      data: {
        condominiumId: condoId,
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        roomNumber,
        phoneNumber,
        pdpaConsent,
        role,
        isEmailVerified: false
      }
    });

    // Generate Email Verification Token
    const tokenString = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        token: tokenString,
        userId: user.id,
        expiresAt
      }
    });

    // Send verification link (logs to console in dev)
    await emailService.sendVerificationEmail(user.email, tokenString);

    return res.status(201).json({
      message: 'Registration successful. A verification email has been sent. Please verify your email to log in.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roomNumber: user.roomNumber,
        role: user.role,
        condominiumId: user.condominiumId
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const condoId = req.condoId; // Injected by tenantMiddleware

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { sellerProfile: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify tenant boundary
    if (user.condominiumId !== condoId && user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'This account does not belong to the selected condominium.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'This account has been suspended for violating community guidelines.' });
    }

    // Verify password using Argon2id
    const isMatch = await argon2.verify(user.passwordHash, password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Enforce email verification check
    if (!user.isEmailVerified) {
      return res.status(403).json({ error: 'Email verification required. Please verify your email before logging in.' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role, user.condominiumId);
    const refreshToken = await generateAndSaveRefreshToken(user.id);

    // Set refresh token in httpOnly secure cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    });

    return res.json({
      message: 'Login successful.',
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roomNumber: user.roomNumber,
        role: user.role,
        condominiumId: user.condominiumId,
        sellerProfile: user.sellerProfile
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
};

const refresh = async (req, res) => {
  try {
    // Extract refresh token from cookies
    const cookieHeader = req.headers.cookie;
    let tokenString = null;
    if (cookieHeader) {
      const match = cookieHeader.match(/refreshToken=([^;]+)/);
      if (match) tokenString = match[1];
    }

    if (!tokenString) {
      return res.status(401).json({ error: 'Refresh token missing.' });
    }

    // Look up token in database
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: tokenString },
      include: { user: true }
    });

    if (!dbToken) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    if (new Date() > dbToken.expiresAt) {
      await prisma.refreshToken.delete({ where: { id: dbToken.id } });
      return res.status(401).json({ error: 'Refresh token expired.' });
    }

    // Check if user is suspended
    if (dbToken.user.isSuspended) {
      return res.status(403).json({ error: 'User is suspended.' });
    }

    // Rotate refresh token
    const newAccessToken = generateAccessToken(dbToken.user.id, dbToken.user.role, dbToken.user.condominiumId);
    const newRefreshTokenString = await generateAndSaveRefreshToken(dbToken.userId);

    // Delete old refresh token
    await prisma.refreshToken.delete({ where: { id: dbToken.id } });

    // Set new cookie
    res.cookie('refreshToken', newRefreshTokenString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    });

    return res.json({ token: newAccessToken });
  } catch (error) {
    console.error('Token Refresh Error:', error);
    return res.status(500).json({ error: 'Internal server error during token refresh.' });
  }
};

const logout = async (req, res) => {
  try {
    const cookieHeader = req.headers.cookie;
    let tokenString = null;
    if (cookieHeader) {
      const match = cookieHeader.match(/refreshToken=([^;]+)/);
      if (match) tokenString = match[1];
    }

    if (tokenString) {
      // Delete token from database
      await prisma.refreshToken.deleteMany({
        where: { token: tokenString }
      });
    }

    // Clear client cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.json({ message: 'Logout successful.' });
  } catch (error) {
    console.error('Logout Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        roomNumber: true,
        phoneNumber: true,
        role: true,
        condominiumId: true,
        condominium: { select: { name: true } },
        createdAt: true,
        sellerProfile: true
      }
    });
    return res.json(user);
  } catch (error) {
    console.error('Profile Fetch Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    const verificationRecord = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!verificationRecord) {
      return res.status(400).json({ error: 'Invalid verification token.' });
    }

    if (new Date() > verificationRecord.expiresAt) {
      // Delete expired token
      await prisma.emailVerificationToken.delete({ where: { id: verificationRecord.id } });
      return res.status(400).json({ error: 'Verification token has expired. Please request a new one.' });
    }

    // Mark user verified
    await prisma.user.update({
      where: { id: verificationRecord.userId },
      data: { isEmailVerified: true }
    });

    // Delete verification token
    await prisma.emailVerificationToken.delete({ where: { id: verificationRecord.id } });

    return res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Email Verification Error:', error);
    return res.status(500).json({ error: 'Internal server error during email verification.' });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const condoId = req.condoId; // Injected by tenantMiddleware

    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), condominiumId: condoId }
    });

    // Security practice: do not leak if user exists or not, return success
    if (!user) {
      return res.json({ message: 'If the email matches an unverified account, a new verification link has been sent.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'This email is already verified. Please log in.' });
    }

    // Remove any previous verification tokens
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id }
    });

    // Generate new token
    const tokenString = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        token: tokenString,
        userId: user.id,
        expiresAt
      }
    });

    await emailService.sendVerificationEmail(user.email, tokenString);

    return res.json({ message: 'If the email matches an unverified account, a new verification link has been sent.' });
  } catch (error) {
    console.error('Resend Verification Error:', error);
    return res.status(500).json({ error: 'Internal server error processing request.' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const condoId = req.condoId; // Injected by tenantMiddleware

    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), condominiumId: condoId }
    });

    // Security practice: do not leak account existence, return success anyway
    if (!user) {
      return res.json({ message: 'If the account exists, a password reset link has been sent.' });
    }

    // Remove any existing password reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    // Generate reset token
    const tokenString = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token: tokenString,
        userId: user.id,
        expiresAt
      }
    });

    await emailService.sendPasswordResetEmail(user.email, tokenString);

    return res.json({ message: 'If the account exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ error: 'Internal server error processing request.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    if (new Date() > resetRecord.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });
      return res.status(400).json({ error: 'Reset token has expired. Please request a new password reset.' });
    }

    // Hash new password using Argon2id
    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });

    // Update user password and mark email verified if it wasn't
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: {
        passwordHash,
        isEmailVerified: true // Auto-verify email upon password recovery
      }
    });

    // Revoke all active refresh sessions for the user to force global logout
    await prisma.refreshToken.deleteMany({
      where: { userId: resetRecord.userId }
    });

    // Delete used reset token
    await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });

    return res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ error: 'Internal server error during password reset.' });
  }
};

module.exports = {
  getCondos,
  register,
  login,
  refresh,
  logout,
  getProfile,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword
};
