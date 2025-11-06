// ============================
//  USER MODEL FOR E-DEALER
// ============================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // 🔹 Basic Info
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  // 🔹 Authentication
  password: {
    type: String,
    required: true,
    minlength: 6
  },

  // 🔹 Optional fields for Firebase users
  firebaseUid: {
    type: String,
    default: null
  },

  // 🔹 Contact & Role
  phone: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['tenant', 'landlord', 'admin', 'agent'],
    default: 'tenant'
  },

  // 🔹 Profile Image
  profileImageUrl: {
    type: String,
    default: null
  }

}, { timestamps: true });

// ============================
//  HASH PASSWORD BEFORE SAVE
// ============================
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ============================
//  COMPARE PASSWORD METHOD
// ============================
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
