const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS Middleware - ONLY ONCE, at the top
app.use(cors({
    origin: [
        'https://e-dealer-e7889.web.app',
        'https://e-dealer-e7889.firebaseapp.com',
        'http://localhost:3000'  // for local testing
    ],
    credentials: true
}));

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/e-dealer')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: '🚀 E-Dealer Backend is running!' });
});

// Health check route for deployment monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/properties', require('./src/routes/properties'));
// app.use('/api/users', require('./src/routes/users'));
// app.use('/api/bookings', require('./src/routes/bookings'));

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// Use Railway's PORT environment variable, fallback to 5000 for local development
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