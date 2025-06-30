const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// Connect to the database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('Connection error', err);
    process.exit(1);
  });

const testAdminLogin = async () => {
  try {
    // Admin credentials
    const adminEmail = 'raghava@truckconnect.com';
    const adminPassword = '12345';
    
    // Find the admin user
    const admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      console.log('Admin user not found! Please run createAdmin.js first.');
      process.exit(1);
    }
    
    console.log('Admin user found:');
    console.log('- ID:', admin._id);
    console.log('- Name:', admin.name);
    console.log('- Email:', admin.email);
    console.log('- Role:', admin.role);
    console.log('- Password hash:', admin.password);
    
    // Test password comparison
    const isMatch = await bcrypt.compare(adminPassword, admin.password);
    console.log('\nPassword comparison result:', isMatch);
    
    if (!isMatch) {
      console.log('\nPassword mismatch! Creating a new hash for comparison:');
      
      // Try with a new hash
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(adminPassword, salt);
      console.log('New hash for "admin123":', newHash);
      
      // Fix the admin account if needed
      console.log('\nUpdating admin password hash...');
      admin.password = newHash;
      await admin.save();
      console.log('Admin password updated. Please try logging in again.');
    } else {
      console.log('\nPassword is correct! Login should work.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error testing admin login:', err);
    process.exit(1);
  }
};

testAdminLogin(); 