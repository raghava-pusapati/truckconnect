require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Driver = require('../models/Driver');
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testProfileEndpoint() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find a customer
    const customer = await User.findOne({ role: 'customer' });
    if (!customer) {
      console.log('❌ No customer found');
      return;
    }

    console.log('\n📋 Testing with Customer:');
    console.log('Name:', customer.name);
    console.log('Email:', customer.email);

    // Generate token for customer
    const customerToken = jwt.sign(
      { id: customer._id, role: customer.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('\n🔑 Generated Token:', customerToken.substring(0, 50) + '...');

    // Test GET /api/profile/me
    console.log('\n🧪 Testing GET /api/profile/me');
    try {
      const response = await axios.get('http://localhost:5000/api/profile/me', {
        headers: {
          'x-auth-token': customerToken
        }
      });
      console.log('✅ Status:', response.status);
      console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
    }

    // Find a driver
    const driver = await Driver.findOne({ status: 'accepted' });
    if (driver) {
      console.log('\n🚛 Testing with Driver:');
      console.log('Name:', driver.name);
      console.log('Email:', driver.email);

      // Generate token for driver
      const driverToken = jwt.sign(
        { id: driver._id, role: 'driver' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      console.log('\n🔑 Generated Token:', driverToken.substring(0, 50) + '...');

      // Test GET /api/profile/me
      console.log('\n🧪 Testing GET /api/profile/me');
      try {
        const response = await axios.get('http://localhost:5000/api/profile/me', {
          headers: {
            'x-auth-token': driverToken
          }
        });
        console.log('✅ Status:', response.status);
        console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));
      } catch (error) {
        console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
      }
    }

    console.log('\n✅ All endpoint tests completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testProfileEndpoint();
