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

// REGISTER (frontend-compatible)
router.post('/register', async (req, res) => {
  try {
    // Accept many possible front-end names and normalize
    const {
      // direct names
      name, email, password, phone, role, firebaseUid, profileImageUrl,
      // alternate names that frontend might send
      firstName, lastName, userEmail, userPassword, fullName, selectedRole,
      // extra (in case)
      profile_image_url
    } = req.body || {};

    // Normalize/compose final values
    const finalEmail = (email || userEmail || '').trim() || null;
    const finalPassword = (password || userPassword) || null;
    const finalName =
      (name && name.trim()) ||
      (fullName && fullName.trim()) ||
      ((firstName || '').trim() + ' ' + (lastName || '').trim()).trim() ||
      null;
    const finalPhone = (phone || '').trim() || null;
    const finalRole = (role || selectedRole || '').toString().trim() || 'tenant';
    const finalFirebaseUid = firebaseUid || null;
    const finalProfileImageUrl = profileImageUrl || profile_image_url || null;

    // If nothing plausible was provided, log request body for debugging
    if (!finalEmail && !finalFirebaseUid) {
      console.log('Register attempt missing both email and firebaseUid:', req.body);
      return res.status(400).json({ message: 'Missing required fields: email or firebaseUid required' });
    }

    // If password not present AND no firebaseUid, reject
    if (!finalPassword && !finalFirebaseUid) {
      console.log('Register attempt missing password and firebaseUid:', req.body);
      return res.status(400).json({ message: 'Missing required fields: password or firebaseUid required' });
    }

    // Ensure a name exists (unless firebaseUid provided and your policy allows no name)
    if (!finalName) {
      // If you prefer to allow empty name when firebaseUid exists, change this condition accordingly.
      return res.status(400).json({ message: 'Missing required fields: name required' });
    }

    // Optional: if Firebase Admin present, optionally verify incoming ID token if provided
    // (Front-end sends a Firebase ID token in Authorization: Bearer <token>)
    try {
      if (typeof admin !== 'undefined' && admin && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const idTok = req.headers.authorization.split(' ')[1];
        const decoded = await admin.auth().verifyIdToken(idTok).catch(err => { throw err; });
        // If firebaseUid was provided, ensure they match (if both present)
        if (finalFirebaseUid && decoded.uid && finalFirebaseUid !== decoded.uid) {
          return res.status(401).json({ message: 'Firebase UID mismatch' });
        }
        // if firebaseUid not provided, adopt uid from token
        if (!finalFirebaseUid && decoded.uid) {
          // Note: we don't overwrite finalFirebaseUid const; set a local var to save later
          // we'll attach below when creating user
        }
      }
    } catch (verifyErr) {
      // If verification fails, do not crash; return informative error
      console.warn('Firebase token verification failed (continuing if firebaseUid not required):', verifyErr.message || verifyErr);
      return res.status(401).json({ message: 'Invalid Firebase token' });
    }

    // Check for existing user by email or firebaseUid
    const existingByEmail = finalEmail ? await User.findOne({ email: finalEmail }) : null;
    if (existingByEmail) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    if (finalFirebaseUid) {
      const existingByUid = await User.findOne({ firebaseUid: finalFirebaseUid });
      if (existingByUid) {
        return res.status(400).json({ message: 'User already exists with this Firebase UID' });
      }
    }

    // Build the new user object. User model pre-save will hash password if present.
    const newUserData = {
      name: finalName,
      email: finalEmail || undefined,
      phone: finalPhone,
      role: (typeof finalRole === 'string') ? finalRole.toLowerCase() : 'tenant',
      firebaseUid: finalFirebaseUid || undefined,
      profileImageUrl: finalProfileImageUrl || undefined
    };

    // Only include password if present
    if (finalPassword) newUserData.password = finalPassword;

    const user = new User(newUserData);
    await user.save();

    // Generate backend JWT (same as your other endpoints)
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Respond with user info (safe fields)
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
        profileImageUrl: user.profileImageUrl
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    // Avoid leaking detailed error stack in production
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
