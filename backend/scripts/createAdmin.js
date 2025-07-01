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

const createAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Admin user already exists with the following details:');
      console.log('- ID:', adminExists._id);
      console.log('- Name:', adminExists.name);
      console.log('- Email:', adminExists.email);
      console.log('- Role:', adminExists.role);
      
      // Ask if they want to reset the password
      console.log('\nTo reset the admin password, please run:');
      console.log('node scripts/testAdminLogin.js');
      
      process.exit(0);
    }
    
    // Admin credentials - you can change these as needed
    const adminData = {
      name: 'Admin User',
      email: 'raghava@truckconnect.com',
      password: '12345', // This will be hashed
      phone: '1234567890',
      role: 'admin'
    };
    
    console.log('Creating admin user with the following credentials:');
    console.log('- Name:', adminData.name);
    console.log('- Email:', adminData.email);
    console.log('- Password:', adminData.password);
    
    // Hash the password with explicit salt rounds
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);
    console.log('- Generated password hash:', hashedPassword);
    
    // Create the admin user
    const admin = new User({
      name: adminData.name,
      email: adminData.email,
      password: hashedPassword,
      phone: adminData.phone,
      role: adminData.role
    });
    
    await admin.save();
    console.log('\nAdmin user created successfully!');
    console.log('You can now log in at the /admin route with:');
    console.log('- Email:', adminData.email);
    console.log('- Password:', adminData.password);
    
    // Test password verification
    const verifyPassword = await bcrypt.compare(adminData.password, hashedPassword);
    console.log('\nPassword verification test:', verifyPassword ? 'PASSED' : 'FAILED');
    
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
};

createAdmin(); 