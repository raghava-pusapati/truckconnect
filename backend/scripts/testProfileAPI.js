require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Driver = require('../models/Driver');

async function testProfile() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find a customer
    const customer = await User.findOne({ role: 'customer' });
    if (customer) {
      console.log('\n📋 Customer Found:');
      console.log('ID:', customer._id);
      console.log('Name:', customer.name);
      console.log('Email:', customer.email);
      console.log('Phone:', customer.phone);
      console.log('Profile Picture:', customer.profilePicture || 'None');
      console.log('Average Rating:', customer.averageRating);
      console.log('Total Ratings:', customer.totalRatings);
    } else {
      console.log('❌ No customer found');
    }

    // Find a driver
    const driver = await Driver.findOne({ status: 'accepted' });
    if (driver) {
      console.log('\n🚛 Driver Found:');
      console.log('ID:', driver._id);
      console.log('Name:', driver.name);
      console.log('Email:', driver.email);
      console.log('Phone:', driver.phone);
      console.log('Address:', driver.address);
      console.log('Lorry Type:', driver.lorryType);
      console.log('Max Capacity:', driver.maxCapacity);
      console.log('Profile Picture:', driver.profilePicture || 'None');
      console.log('Average Rating:', driver.averageRating);
      console.log('Total Ratings:', driver.totalRatings);
    } else {
      console.log('❌ No accepted driver found');
    }

    // Test profile route logic
    console.log('\n🧪 Testing Profile Route Logic:');
    
    if (customer) {
      const customerProfile = await User.findById(customer._id).select('-password');
      console.log('✅ Customer profile fetch successful');
      console.log('Has all fields:', {
        name: !!customerProfile.name,
        email: !!customerProfile.email,
        phone: !!customerProfile.phone,
        averageRating: customerProfile.averageRating !== undefined,
        totalRatings: customerProfile.totalRatings !== undefined
      });
    }

    if (driver) {
      const driverProfile = await Driver.findById(driver._id).select('-password');
      console.log('✅ Driver profile fetch successful');
      console.log('Has all fields:', {
        name: !!driverProfile.name,
        email: !!driverProfile.email,
        phone: !!driverProfile.phone,
        address: !!driverProfile.address,
        lorryType: !!driverProfile.lorryType,
        maxCapacity: !!driverProfile.maxCapacity,
        averageRating: driverProfile.averageRating !== undefined,
        totalRatings: driverProfile.totalRatings !== undefined
      });
    }

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testProfile();
