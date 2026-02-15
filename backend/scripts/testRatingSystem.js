const mongoose = require('mongoose');
const Rating = require('../models/Rating');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Load = require('../models/Load');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testRatingSystem() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Check if ratings exist
    console.log('📊 TEST 1: Checking existing ratings...');
    const allRatings = await Rating.find({});
    console.log(`Found ${allRatings.length} rating records in database`);
    
    if (allRatings.length > 0) {
      console.log('\nSample rating record:');
      console.log(JSON.stringify(allRatings[0], null, 2));
    }

    // Test 2: Check loads with rating flags
    console.log('\n📊 TEST 2: Checking loads with rating flags...');
    const loadsWithRatings = await Load.find({
      $or: [
        { customerRated: true },
        { driverRated: true }
      ]
    });
    console.log(`Found ${loadsWithRatings.length} loads with ratings`);
    
    if (loadsWithRatings.length > 0) {
      console.log('\nSample load with ratings:');
      const sample = loadsWithRatings[0];
      console.log(`Load ID: ${sample._id}`);
      console.log(`Customer Rated: ${sample.customerRated}`);
      console.log(`Driver Rated: ${sample.driverRated}`);
      console.log(`Status: ${sample.status}`);
    }

    // Test 3: Check drivers with average ratings
    console.log('\n📊 TEST 3: Checking drivers with average ratings...');
    const driversWithRatings = await Driver.find({
      averageRating: { $gt: 0 }
    }).select('name averageRating totalRatings');
    
    console.log(`Found ${driversWithRatings.length} drivers with ratings`);
    driversWithRatings.forEach(driver => {
      console.log(`  - ${driver.name}: ${driver.averageRating} ⭐ (${driver.totalRatings} ratings)`);
    });

    // Test 4: Check customers with average ratings
    console.log('\n📊 TEST 4: Checking customers with average ratings...');
    const customersWithRatings = await User.find({
      role: 'customer',
      averageRating: { $gt: 0 }
    }).select('name averageRating totalRatings');
    
    console.log(`Found ${customersWithRatings.length} customers with ratings`);
    customersWithRatings.forEach(customer => {
      console.log(`  - ${customer.name}: ${customer.averageRating} ⭐ (${customer.totalRatings} ratings)`);
    });

    // Test 5: Verify average calculation for a driver
    if (driversWithRatings.length > 0) {
      console.log('\n📊 TEST 5: Verifying average calculation for first driver...');
      const driver = driversWithRatings[0];
      const driverRatings = await Rating.find({
        driverId: driver._id,
        'customerRating.rating': { $exists: true }
      });
      
      console.log(`Driver: ${driver.name}`);
      console.log(`Stored average: ${driver.averageRating}`);
      console.log(`Stored total: ${driver.totalRatings}`);
      console.log(`Actual ratings found: ${driverRatings.length}`);
      
      if (driverRatings.length > 0) {
        const sum = driverRatings.reduce((acc, r) => acc + r.customerRating.rating, 0);
        const calculated = Math.round((sum / driverRatings.length) * 10) / 10;
        console.log(`Calculated average: ${calculated}`);
        console.log(`Match: ${calculated === driver.averageRating ? '✅' : '❌'}`);
        
        console.log('\nIndividual ratings:');
        driverRatings.forEach((r, i) => {
          console.log(`  ${i + 1}. Rating: ${r.customerRating.rating} - "${r.customerRating.review}"`);
        });
      }
    }

    console.log('\n✅ Rating system test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testRatingSystem();
