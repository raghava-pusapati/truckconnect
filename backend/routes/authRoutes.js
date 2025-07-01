const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('../models/User');
const Driver = require('../models/Driver');

// Import controller functions
const { registerUser, loginUser } = require('../controllers/authController');

// ✅ Customer Registration Route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Validate all fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ msg: 'Please fill all fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(409).json({ msg: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || 'customer'
    });

    await newUser.save();
    res.status(201).json({ msg: 'User created successfully' });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ✅ Login Route (Customer or Admin)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ✅ Driver-specific Login Route (Checks driver collection)
router.post('/driver/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
    }

    console.log(`Driver login attempt for: ${email}`);

    // Find driver by email
    const driver = await Driver.findOne({ email });

    if (!driver) {
      console.log(`Driver not found with email: ${email}`);
      return res.status(404).json({ msg: 'Driver not found' });
    }

    // Verify password
    const isMatch = await driver.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for driver');
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: driver._id, 
        email: driver.email,
        role: 'driver'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`Driver login successful for ${email}, status: ${driver.status}`);

    // Return driver data
    res.json({
      token,
      user: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        role: 'driver',
        address: driver.address,
        lorryType: driver.lorryType,
        maxCapacity: driver.maxCapacity,
        status: driver.status,
        rejectionReason: driver.rejectionReason,
        documents: driver.documents
      }
    });
  } catch (err) {
    console.error('Driver login error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ✅ Driver-specific Registration Route
router.post('/driver/register', async (req, res) => {
  try {
    // Extract form data and documents from request body
    const { 
      name, 
      email, 
      password, 
      phone, 
      address, 
      lorryType, 
      maxCapacity,
      documents
    } = req.body;

    console.log(`Driver registration attempt for: ${email}`);

    // Validate required fields
    if (!name || !email || !password || !phone || !address || !lorryType || !maxCapacity) {
      console.log('Missing required fields');
      return res.status(400).json({ msg: 'Please fill all required fields' });
    }

    // Validate required documents
    const requiredDocuments = ['license', 'rc', 'fitness', 'insurance', 'medical'];
    const missingDocuments = requiredDocuments.filter(doc => !documents || !documents[doc]);
    
    if (missingDocuments.length > 0) {
      console.log(`Missing document files: ${missingDocuments.join(', ')}`);
      return res.status(400).json({ 
        msg: `The following required documents are missing: ${missingDocuments.join(', ')}` 
      });
    }

    // Check if driver already exists
    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      console.log(`Driver already exists with email: ${email}`);
      return res.status(409).json({ msg: 'Driver already exists with this email' });
    }

    // Create new driver with document base64 data
    console.log('Creating new driver document...');
    const newDriver = new Driver({
      name,
      email,
      password, // Password will be hashed by pre-save hook in the model
      phone,
      address,
      lorryType,
      maxCapacity,
      status: 'pending',
      documents: {
        license: documents.license,
        rc: documents.rc,
        fitness: documents.fitness,
        insurance: documents.insurance,
        medical: documents.medical,
        allIndiaPermit: documents.allIndiaPermit || null
      }
    });

    // Save to database
    console.log('Saving to database...');
    await newDriver.save();
    console.log(`Driver registration successful with documents: ${email}`);
    
    res.status(201).json({ msg: 'Driver registered successfully. Your account is pending admin approval.' });
  } catch (err) {
    console.error('Driver registration error:', err);
    
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// 🔧 TEMP: Seed test customer route (used only once for testing)
router.post('/seed-customer', async (req, res) => {
  try {
    const existing = await User.findOne({ email: 'test@example.com' });
    if (existing) return res.status(400).json({ msg: 'Customer already exists' });

    const hashedPassword = await bcrypt.hash('test123', 10);
    const newUser = new User({
      name: 'Test Customer',
      email: 'test@example.com',
      password: hashedPassword,
      phone: '1234567890',
    });

    await newUser.save();
    res.json({ msg: 'Test customer created!' });
  } catch (err) {
    res.status(500).json({ msg: 'Error', error: err.message });
  }
});

module.exports = router;