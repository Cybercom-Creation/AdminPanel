// models/AdminUser.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Ensure usernames are unique
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensure emails are unique
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'is invalid'], // Basic email validation
  },
  password: {
    type: String,
    required: true,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  last_login: {
    type: Date,
  },
  resetPasswordToken: String, // To store the password reset token
  resetPasswordExpires: Date, // To store the token's expiration date
}, {
  timestamps: { createdAt: 'created_at' } // Automatically manage created_at
});

// --- Password Hashing ---
// Hash password before saving a new user
adminUserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10); // Generate salt
    this.password = await bcrypt.hash(this.password, salt); // Hash password
    next();
  } catch (error) {
    next(error); // Pass error to the next middleware
  }
});

// --- Password Comparison Method ---
// Method to compare candidate password with the hashed password
adminUserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error; // Re-throw error to be caught by the caller
  }
};


module.exports = mongoose.model('AdminUser', adminUserSchema, 'admin_users'); // Explicitly set collection name
