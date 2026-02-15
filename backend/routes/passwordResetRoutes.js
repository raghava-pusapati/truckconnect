const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Driver = require('../models/Driver');
const PasswordReset = require('../models/PasswordReset');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Request password reset
router.post('/request', async (req, res) => {
  try {
    const { email, userType } = req.body;

    console.log('=== PASSWORD RESET REQUEST RECEIVED ===');
    console.log('Email:', email);
    console.log('User Type:', userType);

    if (!email || !userType) {
      console.log('ERROR: Missing email or userType');
      return res.status(400).json({ msg: 'Email and user type are required' });
    }

    // Find user based on type
    let user;
    if (userType === 'driver') {
      console.log('Searching for driver with email:', email);
      user = await Driver.findOne({ email });
      console.log('Driver found:', user ? 'Yes' : 'No');
      if (user) {
        console.log('Driver details:', { id: user._id, name: user.name, email: user.email });
      }
    } else {
      console.log('Searching for user with email:', email, 'and role:', userType);
      user = await User.findOne({ email, role: userType });
      console.log('User found:', user ? 'Yes' : 'No');
      if (user) {
        console.log('User details:', { id: user._id, name: user.name, email: user.email, role: user.role });
      }
    }

    if (!user) {
      console.log('ERROR: No account found with this email');
      // Return 404 if user doesn't exist
      return res.status(404).json({ msg: 'No account found with this email address. Please check your email or register first.' });
    }

    // Generate 6-digit OTP code
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    console.log('=== OTP GENERATION ===');
    console.log('Generated 6-digit OTP:', resetToken);
    console.log('Hashed token (stored in DB):', hashedToken);

    // Save reset token
    await PasswordReset.create({
      email,
      resetToken: hashedToken,
      userType,
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    });
    
    console.log('=== PASSWORD RESET TOKEN SAVED ===');
    console.log('Token saved to database for email:', email);

    // Send email with OTP/token
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@truckconnect.com',
      to: email,
      subject: 'Password Reset OTP - TruckConnect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You requested to reset your password for your TruckConnect account.</p>
          <p>Use the 6-digit OTP code below to reset your password:</p>
          <div style="background: #f97316; color: white; padding: 30px; text-align: center; font-size: 32px; letter-spacing: 10px; margin: 20px 0; border-radius: 8px; font-weight: bold;">
            ${resetToken}
          </div>
          <p style="color: #666; font-size: 14px;">This OTP will expire in 1 hour.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Best regards,<br>TruckConnect Team</p>
        </div>
      `
    };

    console.log('=== SENDING EMAIL ===');
    console.log('From:', mailOptions.from);
    console.log('To:', mailOptions.to);
    console.log('Subject:', mailOptions.subject);

    try {
      await transporter.sendMail(mailOptions);
      console.log('✓ Password reset email sent successfully to:', email);
    } catch (emailError) {
      console.error('✗ ERROR sending email:', emailError.message);
      // For development: Still return success with OTP
      console.log('⚠️ Email failed but continuing for development...');
      console.log('📧 OTP CODE (for testing):', resetToken);
    }
    
    console.log('=== PASSWORD RESET REQUEST COMPLETED ===');
    res.json({ 
      msg: 'Password reset OTP sent to your email'
      // OTP only shown in backend console for development/testing
    });
  } catch (err) {
    console.error('=== PASSWORD RESET ERROR ===');
    console.error('Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Verify OTP (new endpoint)
router.post('/verify-otp', async (req, res) => {
  try {
    const { token, email, userType } = req.body;

    console.log('=== OTP VERIFICATION REQUEST ===');
    console.log('Email:', email);
    console.log('User Type:', userType);
    console.log('OTP entered:', token);

    if (!token || !email || !userType) {
      console.log('ERROR: Missing required fields');
      return res.status(400).json({ msg: 'Token, email, and user type are required' });
    }

    // Hash the token to compare
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log('Hashed token for comparison:', hashedToken);

    // Find valid reset token
    const resetRecord = await PasswordReset.findOne({
      email,
      resetToken: hashedToken,
      userType,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    console.log('Reset record found:', resetRecord ? 'Yes' : 'No');

    if (!resetRecord) {
      console.log('ERROR: Invalid or expired OTP');
      return res.status(400).json({ msg: 'Invalid or expired OTP. Please try again.' });
    }

    console.log('✓ OTP verified successfully');
    res.json({ msg: 'OTP verified successfully' });
  } catch (err) {
    console.error('=== OTP VERIFICATION ERROR ===');
    console.error('Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Reset password with token
router.post('/reset', async (req, res) => {
  try {
    const { token, newPassword, userType } = req.body;

    if (!token || !newPassword || !userType) {
      return res.status(400).json({ msg: 'Token, new password, and user type are required' });
    }

    // Hash the token to compare
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const resetRecord = await PasswordReset.findOne({
      resetToken: hashedToken,
      userType,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      return res.status(400).json({ msg: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password based on user type
    if (userType === 'driver') {
      await Driver.findOneAndUpdate(
        { email: resetRecord.email },
        { password: hashedPassword }
      );
    } else {
      await User.findOneAndUpdate(
        { email: resetRecord.email, role: userType },
        { password: hashedPassword }
      );
    }

    // Mark token as used
    resetRecord.used = true;
    await resetRecord.save();

    res.json({ msg: 'Password reset successful' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
