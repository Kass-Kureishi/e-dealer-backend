// ============================
//  AUTH ROUTES FOR E-DEALER
// ============================

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let admin = null; // 👈 Placeholder for Firebase Admin (optional)
try {
  // Try loading firebase-admin if installed
  admin = require('firebase-admin');

  // Initialize Firebase Admin SDK (only once)
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.warn('⚠️ Firebase Admin not found or failed to initialize — skipping Firebase integration.');
}

const router = express.Router();

// ============================
// 🔹 REGISTER ENDPOINT
// ============================
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phone,
      role,
      firebaseUid,
      profileImageUrl,
    } = req.body;

    // ✅ Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // ✅ Optional Firebase token verification
    /*
    if (admin && req.headers.authorization?.startsWith('Bearer ')) {
      const idToken = req.headers.authorization.split(' ')[1];
      await admin.auth().verifyIdToken(idToken);
    }
    */

    // ✅ Create new user
    const user = new User({
      email,
      password,
      name,
      phone,
      role: role || 'tenant',
      firebaseUid,
      profileImageUrl: profileImageUrl || null,
    });

    await user.save();

    // ✅ Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        firebaseUid: user.firebaseUid,
        profileImageUrl: user.profileImageUrl,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// ============================
// 🔹 LOGIN ENDPOINT
// ============================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        firebaseUid: user.firebaseUid,
        profileImageUrl: user.profileImageUrl,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

module.exports = router;
