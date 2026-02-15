const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

// Initialize express
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Add request timeout middleware (30 seconds max)
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 seconds
  res.setTimeout(30000);
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/password-reset', require('./routes/passwordResetRoutes'));
app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/driver', require('./routes/driverRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/loads', require('./routes/loadRoutes'));
app.use('/api/ratings', require('./routes/ratingRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));

// Test route
app.get('/api/test', (req, res) => {
  res.send('API is running...');
});

// Health check endpoint (for keeping server warm)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: 'connected'
  });
});

// Debug route to check users
app.get('/api/debug/users', async (req, res) => {
  try {
    const User = require('./models/User');
    const Driver = require('./models/Driver');
    
    const customers = await User.find({ role: 'customer' }).select('email name role');
    const admins = await User.find({ role: 'admin' }).select('email name role');
    const drivers = await Driver.find().select('email name');
    
    res.json({
      customers: customers.length,
      admins: admins.length,
      drivers: drivers.length,
      customerEmails: customers.map(u => u.email),
      adminEmails: admins.map(u => u.email),
      driverEmails: drivers.map(d => d.email)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Default error handler
app.use((err, req, res, next) => {
  console.error('Error caught by error handler:', err);
  
  // Handle Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        msg: 'File too large. Maximum file size is 5MB per document.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        msg: 'Too many files uploaded.' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        msg: 'Unexpected file field. Please check your form.' 
      });
    }
    return res.status(400).json({ 
      msg: 'File upload error', 
      error: err.message 
    });
  }
  
  // Handle other errors
  res.status(err.status || 500).json({ 
    msg: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
