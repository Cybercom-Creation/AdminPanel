// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const crypto = require('crypto'); // For generating tokens
const nodemailer = require('nodemailer'); // To send emails

const router = express.Router();

// --- Login Route ---
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // 1. Find user by email
    const user = await AdminUser.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`Login attempt failed: User not found for email ${email}`);
      return res.status(401).json({ message: 'Invalid credentials.' }); // Generic error
    }

    // 2. Check if user is active
    if (!user.is_active) {
        console.log(`Login attempt failed: User ${email} is inactive.`);
        return res.status(403).json({ message: 'Account is inactive.' });
    }

    // 3. Compare passwords
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log(`Login attempt failed: Incorrect password for email ${email}`);
      return res.status(401).json({ message: 'Invalid credentials.' }); // Generic error
    }

    // 4. Update last_login timestamp (don't wait for this to complete)
    AdminUser.updateOne({ _id: user._id }, { $set: { last_login: new Date() } })
        .catch(err => console.error("Error updating last_login:", err)); // Log error if update fails

    // 5. Generate JWT
    const payload = {
      userId: user._id,
      email: user.email,
      username: user.username,
      // Add other relevant non-sensitive info if needed
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expiration time (e.g., 1 hour)
    );

    // 6. Send token and user info (excluding password) back to client
    console.log(`Login successful for user: ${user.email}`);
    res.json({
      message: 'Login successful!',
      token: token,
      user: { // Send back some user details (optional)
        id: user._id,
        email: user.email,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// --- TODO: Add Registration Route (for initial setup or specific needs) ---
// router.post('/register', async (req, res) => { ... });
// Be careful about who can register admin users!



// --- TODO: Add Forgot Password / Reset Password Routes ---
// These are more complex and involve email sending & token management.
// --- Nodemailer Transporter Setup (reuse from server.js or define here) ---
    // Ensure EMAIL_SERVICE, EMAIL_USER, EMAIL_PASS are in your .env
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail', // Default to gmail if not set
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    
    // --- Forgot Password Route ---
    // POST /api/auth/forgot-password
    router.post('/forgot-password', async (req, res) => {
        const { email } = req.body;
    
        if (!email) {
            return res.status(400).json({ message: 'Email address is required.' });
        }
    
        try {
            const user = await AdminUser.findOne({ email: email.toLowerCase() });
    
            if (!user) {
                // IMPORTANT: Don't reveal if the user exists or not for security
                console.log(`Forgot password attempt for non-existent email: ${email}`);
                return res.status(200).json({ message: 'If your email address is registered, you will receive a password reset link.' });
            }
    
            // Generate a secure token
            const token = crypto.randomBytes(32).toString('hex');
    
            // Set token and expiry (e.g., 1 hour)
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour in milliseconds
    
            await user.save();
    
            // Construct reset URL (Use environment variable for frontend URL)
            const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; // Default for Vite dev
            const resetUrl = `${frontendBaseUrl}/reset-password/${token}`;
    
            // Send email
            const mailOptions = {
                from: `"Admin Panel" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: 'Admin Panel Password Reset Request',
                text: `You are receiving this email because you (or someone else) have requested the reset of the password for your admin account.\n\n` +
                      `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
                      `${resetUrl}\n\n` +
                      `This link will expire in 1 hour.\n\n` +
                      `If you did not request this, please ignore this email and your password will remain unchanged.\n`
            };
    
            await transporter.sendMail(mailOptions);
            console.log(`Password reset email sent to ${user.email}`);
    
            res.status(200).json({ message: 'If your email address is registered, you will receive a password reset link.' });
    
        } catch (error) {
            console.error('Forgot Password Error:', error);
            // Handle potential email sending errors specifically if needed
            res.status(500).json({ message: 'Error processing forgot password request.' });
        }
    });
    
    // --- Reset Password Route ---
    // POST /api/auth/reset-password/:token
    router.post('/reset-password/:token', async (req, res) => {
        const { token } = req.params;
        const { password } = req.body;
    
        if (!password) {
            return res.status(400).json({ message: 'New password is required.' });
        }
    
        try {
            // Find user by token and check expiry
            const user = await AdminUser.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() } // Check if expiry date is greater than now
            });
    
            if (!user) {
                console.log(`Password reset attempt with invalid or expired token: ${token}`);
                return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
            }
    
            // Set the new password (pre-save hook will hash it)
            user.password = password;
            user.resetPasswordToken = undefined; // Clear the token
            user.resetPasswordExpires = undefined; // Clear the expiry
    
            await user.save();
    
            console.log(`Password successfully reset for user: ${user.email}`);
            // Optionally: Send a confirmation email to the user
            res.status(200).json({ message: 'Password has been successfully reset. You can now log in.' });
    
        } catch (error) {
            console.error('Reset Password Error:', error);
            res.status(500).json({ message: 'Error resetting password.' });
        }
    });


module.exports = router;
