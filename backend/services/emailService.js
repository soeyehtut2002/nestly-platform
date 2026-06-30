const nodemailer = require('nodemailer');

const getTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

const sendVerificationEmail = async (email, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
  
  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Nestly Community" <noreply@nestly.com>',
        to: email,
        subject: 'Verify your Nestly Account',
        text: `Please verify your Nestly account by clicking the following link: ${verificationLink}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #007a53; text-align: center;">Welcome to Nestly!</h2>
            <p>Thank you for registering. Please click the button below to verify your email address and activate your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background-color: #007a53; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </div>
            <p style="color: #666; font-size: 0.85rem;">If the button above does not work, copy and paste this URL into your browser:</p>
            <p style="color: #666; font-size: 0.85rem; word-break: break-all;">${verificationLink}</p>
          </div>
        `
      });
      return { success: true };
    } catch (err) {
      console.error('Nodemailer failed to send verification email:', err.message);
      throw new Error('Email delivery failed.');
    }
  } else {
    console.log(`
=========================================
[EMAIL MOCK] Verification Email Sent (Fallback)
To: ${email}
Subject: Verify your Nestly Account
Link: ${verificationLink}
=========================================
`);
    return { success: true };
  }
};

const sendPasswordResetEmail = async (email, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Nestly Security" <security@nestly.com>',
        to: email,
        subject: 'Nestly Password Reset Request',
        text: `Please reset your password by clicking the following link: ${resetLink}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #007a53; text-align: center;">Nestly Password Reset</h2>
            <p>You requested a password reset for your Nestly account. Click the button below to choose a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #007a53; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 0.85rem;">If the button above does not work, copy and paste this URL into your browser:</p>
            <p style="color: #666; font-size: 0.85rem; word-break: break-all;">${resetLink}</p>
            <p style="color: #e91e63; font-size: 0.85rem; font-weight: bold;">Note: This link will expire shortly. If you did not request this, please ignore this email.</p>
          </div>
        `
      });
      return { success: true };
    } catch (err) {
      console.error('Nodemailer failed to send password reset email:', err.message);
      throw new Error('Email delivery failed.');
    }
  } else {
    console.log(`
=========================================
[EMAIL MOCK] Password Reset Email Sent (Fallback)
To: ${email}
Subject: Nestly Password Reset Request
Link: ${resetLink}
=========================================
`);
    return { success: true };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
