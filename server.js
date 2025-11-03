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
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// Basic route - FIXED: Added missing closing brace
app.get('/', (req, res) => {
  res.json({ message: '🚀 E-Dealer Backend is running!' });
}); // ← This was missing

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/properties', require('./src/routes/properties'));
// app.use('/api/users', require('./src/routes/users'));
// app.use('/api/bookings', require('./src/routes/bookings'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🎯 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});

// REMOVE THIS DUPLICATE LINE:
// const cors = require('cors');