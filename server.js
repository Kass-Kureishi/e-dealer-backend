// =========================
//  E-DEALER BACKEND SERVER
// =========================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ======================
// 🔒 CORS CONFIGURATION
// ======================
app.use(cors({
  origin: [
    'https://e-dealer-e7889.web.app',
    'https://e-dealer-e7889.firebaseapp.com',
    'https://e-dealer-82386172-34d9d.web.app',
    'http://localhost:3000', // for local testing
    'https://e-dealer-backend-production.up.railway.app'
  ],
  credentials: true,
}));

// ======================
// 🔧 GLOBAL MIDDLEWARES
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// 🗄️ DATABASE CONNECTION
// ======================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/e-dealer', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ======================
// 🌐 BASIC ROUTES
// ======================
app.get('/', (req, res) => {
  res.json({ message: '🚀 E-Dealer Backend is running!' });
});

// Health check route (useful for Railway uptime checks)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// ======================
// 🚏 API ROUTES
// ======================
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/properties', require('./src/routes/properties'));
// app.use('/api/users', require('./src/routes/users'));
// app.use('/api/bookings', require('./src/routes/bookings'));

// ======================
// ❌ 404 NOT FOUND HANDLER
// ======================
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ======================
// 💥 ERROR HANDLING
// ======================
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message,
  });
});

// ======================
// 🚀 SERVER STARTUP
// ======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎯 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);

  if (process.env.NODE_ENV === 'production') {
    console.log(`🚀 Production server deployed on Railway`);
  } else {
    console.log(`🔧 Development server: http://localhost:${PORT}`);
  }
});
