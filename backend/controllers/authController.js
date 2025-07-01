const User = require('../models/User');
const Driver = require('../models/Driver');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, address, lorryType, maxCapacity } = req.body;

    // Validate all fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ msg: 'Please fill all fields' });
    }

    // Check if user already exists in either collection
    const existingUser = await User.findOne({ email });
    const existingDriver = await Driver.findOne({ email });
    
    if (existingUser || existingDriver) {
      return res.status(409).json({ msg: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // If the role is driver, create a driver document
    if (role === 'driver') {
      // Validate driver-specific fields
      if (!address || !lorryType || !maxCapacity) {
        return res.status(400).json({ msg: 'Please fill all driver fields' });
      }
      
      // Create new driver
      const newDriver = new Driver({
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        lorryType,
        maxCapacity,
        status: 'pending' // All drivers start with pending status
      });

      await newDriver.save();
      return res.status(201).json({ msg: 'Driver registered successfully' });
    }

    // For customer or other roles, create a user document
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || 'customer' // Default to customer if no role specified
    });

    await newUser.save();
    res.status(201).json({ msg: 'User created successfully' });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
    }

    console.log(`Login attempt for: ${email}`);

    // Check if user exists in customer collection
    let user = await User.findOne({ email });
    let isMatch = false;
    let isDriver = false;
    let driverData = null;

    // If not found in User collection, check Driver collection
    if (!user) {
      console.log(`User not found in User collection, checking Driver collection...`);
      driverData = await Driver.findOne({ email });
      if (driverData) {
        isDriver = true;
        console.log(`Found in Driver collection. Status: ${driverData.status}`);
        isMatch = await bcrypt.compare(password, driverData.password);
        console.log(`Password match for driver: ${isMatch}`);
      } else {
        console.log(`User not found in any collection`);
      }
    } else {
      // Verify password for regular user
      console.log(`Found in User collection. Role: ${user.role}`);
      isMatch = await bcrypt.compare(password, user.password);
      console.log(`Password match for user: ${isMatch}`);
      
      // Special debug for admin users
      if (user.role === 'admin') {
        console.log('Admin login attempt');
        console.log(`Stored hashed password: ${user.password}`);
        console.log(`Input password: ${password}`);
        
        // Try direct comparison for troubleshooting
        if (!isMatch) {
          console.log('Admin password mismatch. Testing other hash methods...');
          
          // Create a fresh hash for comparison
          const freshHash = await bcrypt.hash(password, 10);
          console.log(`Fresh hash of input password: ${freshHash}`);
          
          // Try with pre-configured salt rounds
          const salt = await bcrypt.genSalt(10);
          const testHash = await bcrypt.hash(password, salt);
          console.log(`Test hash with explicit salt: ${testHash}`);
        }
      }
    }

    // Handle invalid credentials
    if (!user && !driverData) {
      console.log('Invalid credentials: User not found');
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    if (!isMatch) {
      console.log('Invalid credentials: Password mismatch');
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    // If driver, check if account is approved
    if (isDriver && driverData.status !== 'accepted') {
      console.log('Driver account not approved');
      return res.status(403).json({ 
        msg: 'Your account is pending approval. Please contact admin.'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: isDriver ? driverData._id : user._id, 
        email: email,
        role: isDriver ? 'driver' : user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`Login successful for ${email}, role: ${isDriver ? 'driver' : user.role}`);

    // Return appropriate user data and token
    if (isDriver) {
      return res.json({
        token,
        user: {
          id: driverData._id,
          name: driverData.name,
          email: driverData.email,
          phone: driverData.phone,
          role: 'driver',
          address: driverData.address,
          lorryType: driverData.lorryType,
          maxCapacity: driverData.maxCapacity,
          status: driverData.status
        }
      });
    }

    // Return regular user data
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
};