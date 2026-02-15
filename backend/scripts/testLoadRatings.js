const mongoose = require('mongoose');
const Load = require('../models/Load');
const Driver = require('../models/Driver');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testLoadRatings() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Find assigned loads
    console.log('📊 TEST 1: Finding assigned loads...');
    const assignedLoads = await Load.find({ status: 'assigned' });
    console.log(`Found ${assignedLoads.length} assigned loads`);
    
    const completedLoads = await Load.find({ status: 'completed' }).limit(3);
    console.log(`Found ${completedLoads.length} completed loads\n`);

    if (assignedLoads.length > 0) {
      const load = assignedLoads[0];
      console.log('Sample assigned load:');
      console.log(`Load ID: ${load._id}`);
      console.log(`Status: ${load.status}`);
      console.log(`Has assignedDriver: ${!!load.assignedDriver}`);
      
      if (load.assignedDriver) {
        console.log(`Driver ID: ${load.assignedDriver.driverId}`);
        console.log(`Driver Name: ${load.assignedDriver.name}`);
        console.log(`Driver has averageRating field: ${load.assignedDriver.averageRating !== undefined}`);
        console.log(`Driver averageRating value: ${load.assignedDriver.averageRating}`);
        
        // Fetch driver from database
        console.log('\n📊 Fetching driver from database...');
        const driver = await Driver.findById(load.assignedDriver.driverId);
        if (driver) {
          console.log(`Driver found in DB: ${driver.name}`);
          console.log(`Driver averageRating in DB: ${driver.averageRating}`);
          console.log(`Driver totalRatings in DB: ${driver.totalRatings}`);
        } else {
          console.log('❌ Driver not found in database!');
        }
      }
    }
    
    // Check completed loads
    if (completedLoads.length > 0) {
      console.log('\n📊 Checking completed loads...');
      for (const load of completedLoads) {
        console.log(`\nCompleted Load ${load._id}:`);
        console.log(`  Source: ${load.source} → ${load.destination}`);
        console.log(`  Has assignedDriver: ${!!load.assignedDriver}`);
        
        if (load.assignedDriver && load.assignedDriver.driverId) {
          console.log(`  Driver: ${load.assignedDriver.name}`);
          const driver = await Driver.findById(load.assignedDriver.driverId);
          if (driver) {
            console.log(`  Driver Rating: ${driver.averageRating} ⭐ (${driver.totalRatings} ratings)`);
          }
        }
      }
    }

    // Test 2: Check customer loads endpoint simulation
    console.log('\n📊 TEST 2: Simulating customer loads endpoint...');
    const customerLoads = await Load.find({ status: { $in: ['pending', 'assigned'] } }).limit(3);
    
    for (const load of customerLoads) {
      const loadObj = load.toObject();
      
      if (loadObj.assignedDriver && loadObj.assignedDriver.driverId) {
        console.log(`\nLoad ${loadObj._id}:`);
        console.log(`  Status: ${loadObj.status}`);
        console.log(`  Driver: ${loadObj.assignedDriver.name}`);
        
        const driver = await Driver.findById(loadObj.assignedDriver.driverId);
        if (driver) {
          console.log(`  Driver Rating in DB: ${driver.averageRating} (${driver.totalRatings} ratings)`);
          loadObj.assignedDriver.averageRating = driver.averageRating || 0;
          loadObj.assignedDriver.totalRatings = driver.totalRatings || 0;
          console.log(`  After adding: ${loadObj.assignedDriver.averageRating} (${loadObj.assignedDriver.totalRatings} ratings)`);
        }
      }
    }

    // Test 3: Check drivers with ratings
    console.log('\n📊 TEST 3: Drivers with ratings...');
    const driversWithRatings = await Driver.find({ averageRating: { $gt: 0 } });
    console.log(`Found ${driversWithRatings.length} drivers with ratings:`);
    driversWithRatings.forEach(d => {
      console.log(`  - ${d.name}: ${d.averageRating} ⭐ (${d.totalRatings} ratings)`);
    });

    // Test 4: Check customers with ratings
    console.log('\n📊 TEST 4: Customers with ratings...');
    const customersWithRatings = await User.find({ 
      role: 'customer',
      averageRating: { $gt: 0 } 
    });
    console.log(`Found ${customersWithRatings.length} customers with ratings:`);
    customersWithRatings.forEach(c => {
      console.log(`  - ${c.name}: ${c.averageRating} ⭐ (${c.totalRatings} ratings)`);
    });

    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testLoadRatings();
