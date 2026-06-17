const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
require('dotenv').config();

// Initialize express
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

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
app.use('/api/tracking', require('./routes/trackingRoutes'));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join room for a specific load
  socket.on('join-tracking', (loadId) => {
    socket.join(`load-${loadId}`);
    console.log(`Client ${socket.id} joined tracking room for load ${loadId}`);
  });

  // Leave tracking room
  socket.on('leave-tracking', (loadId) => {
    socket.leave(`load-${loadId}`);
    console.log(`Client ${socket.id} left tracking room for load ${loadId}`);
  });

  // Handle location updates from driver
  socket.on('update-location', (data) => {
    const { loadId, latitude, longitude } = data;
    console.log(`Location update for load ${loadId}:`, { latitude, longitude });
    
    // Broadcast to all clients tracking this load
    io.to(`load-${loadId}`).emit('location-updated', {
      latitude,
      longitude,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

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
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
