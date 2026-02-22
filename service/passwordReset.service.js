const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User.model');
const OTP = require('../models/OTP.model');
require('dotenv').config();

// Configure nodemailer transporter
function getTransporter() {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate a secure reset token
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Check if user exists by email or username, generate OTP, send email
 */
async function forgotPassword({ email, username }) {
  if (!email && !username) {
    const error = new Error('Email or username is required');
    error.status = 400;
    throw error;
  }

  // Find user
  let query;
  if (email) {
    query = { email: email.toLowerCase() };
  } else {
    query = { username };
  }

  const user = await User.findOne(query);
  if (!user) {
    const error = new Error('No account found with that email or username');
    error.status = 404;
    console.error('Forgot password error: user not found -', query);
    throw error;
  }

  // Delete any existing OTPs for this email
  await OTP.deleteMany({ email: user.email });

  // Generate OTP and reset token
  const otp = generateOTP();
  const resetToken = generateResetToken();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store OTP in database
  await OTP.create({
    email: user.email,
    otp,
    resetToken,
    expiresAt,
  });

  // Send email
  const transporter = getTransporter();
  const mailOptions = {
    from: `"Cookify" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Cookify - Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #16A34A; margin: 0;">Cookify</h1>
          <p style="color: #6B7280; margin-top: 4px;">Password Reset Request</p>
        </div>
        <div style="background-color: #F0FDF4; border-radius: 12px; padding: 24px; text-align: center;">
          <p style="color: #111827; font-size: 16px; margin-bottom: 8px;">Hi <strong>${user.name}</strong>,</p>
          <p style="color: #6B7280; font-size: 14px; margin-bottom: 20px;">
            Use the following verification code to reset your password:
          </p>
          <div style="background-color: #FFFFFF; border: 2px solid #16A34A; border-radius: 8px; padding: 16px; display: inline-block;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #16A34A;">${otp}</span>
          </div>
          <p style="color: #9CA3AF; font-size: 12px; margin-top: 20px;">
            This code expires in 10 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);

  return {
    email: user.email,
    message: 'OTP sent successfully',
  };
}

/**
 * Verify the OTP
 */
async function verifyOTP({ email, otp }) {
  if (!email || !otp) {
    const error = new Error('Email and OTP are required');
    error.status = 400;
    throw error;
  }

  const otpRecord = await OTP.findOne({
    email: email.toLowerCase(),
    otp,
    verified: false,
  });

  if (!otpRecord) {
    const error = new Error('Invalid or expired OTP');
    error.status = 400;
    console.error('Verify OTP error: no matching record for -', email);
    throw error;
  }

  if (otpRecord.expiresAt < new Date()) {
    await OTP.deleteOne({ _id: otpRecord._id });
    const error = new Error('OTP has expired. Please request a new one.');
    error.status = 400;
    console.error('Verify OTP error: expired OTP for -', email);
    throw error;
  }

  // Mark as verified
  otpRecord.verified = true;
  await otpRecord.save();

  return {
    resetToken: otpRecord.resetToken,
    message: 'OTP verified successfully',
  };
}

/**
 * Reset the user's password
 */
async function resetUserPassword({ email, resetToken, newPassword }) {
  if (!email || !resetToken || !newPassword) {
    const error = new Error('Email, reset token, and new password are required');
    error.status = 400;
    throw error;
  }

  if (newPassword.length < 6) {
    const error = new Error('Password must be at least 6 characters');
    error.status = 400;
    throw error;
  }

  // Find the verified OTP record with matching reset token
  const otpRecord = await OTP.findOne({
    email: email.toLowerCase(),
    resetToken,
    verified: true,
  });

  if (!otpRecord) {
    const error = new Error('Invalid or expired reset token');
    error.status = 400;
    console.error('Reset password error: invalid reset token for -', email);
    throw error;
  }

  if (otpRecord.expiresAt < new Date()) {
    await OTP.deleteOne({ _id: otpRecord._id });
    const error = new Error('Reset token has expired. Please start over.');
    error.status = 400;
    console.error('Reset password error: expired token for -', email);
    throw error;
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  // Update user's password
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { passwordHash },
    { new: true }
  );

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    console.error('Reset password error: user not found -', email);
    throw error;
  }

  // Clean up OTP records for this email
  await OTP.deleteMany({ email: email.toLowerCase() });

  return {
    message: 'Password reset successfully',
  };
}

module.exports = {
  forgotPassword,
  verifyOTP,
  resetUserPassword,
};
