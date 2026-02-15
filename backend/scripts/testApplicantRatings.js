const mongoose = require('mongoose');
const Load = require('../models/Load');
const Driver = require('../models/Driver');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testApplicantRatings() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find pending loads with applicants
    console.log('📊 Finding pending loads with applicants...');
    const pendingLoads = await Load.find({ 
      status: 'pending',
      'applicants.0': { $exists: true }
    });
    
    console.log(`Found ${pendingLoads.length} pending loads with applicants\n`);

    if (pendingLoads.length > 0) {
      for (const load of pendingLoads) {
        console.log(`\n📦 Load: ${load.source} → ${load.destination}`);
        console.log(`   Load ID: ${load._id}`);
        console.log(`   Applicants: ${load.applicants.length}`);
        
        for (const applicant of load.applicants) {
          console.log(`\n   👤 Applicant: ${applicant.name}`);
          console.log(`      Driver ID: ${applicant.driverId}`);
          
          // Fetch driver details
          const driver = await Driver.findById(applicant.driverId);
          if (driver) {
            console.log(`      ✅ Driver found in DB`);
            console.log(`      Average Rating: ${driver.averageRating || 'NO RATING'}`);
            console.log(`      Total Ratings: ${driver.totalRatings || 0}`);
            console.log(`      Status: ${driver.status}`);
          } else {
            console.log(`      ❌ Driver NOT found in DB`);
          }
        }
      }
    } else {
      console.log('⚠️  No pending loads with applicants found');
      console.log('\nTo test:');
      console.log('1. Login as customer and post a load');
      console.log('2. Login as driver and apply for the load');
      console.log('3. Run this script again');
    }

    // Show all drivers and their ratings
    console.log('\n\n📊 All Drivers and Their Ratings:');
    const allDrivers = await Driver.find({});
    console.log(`Total drivers: ${allDrivers.length}\n`);
    
    allDrivers.forEach(driver => {
      const rating = driver.averageRating || 0;
      const total = driver.totalRatings || 0;
      const ratingDisplay = rating > 0 ? `${rating} ⭐ (${total} ratings)` : 'No ratings yet';
      console.log(`  - ${driver.name}: ${ratingDisplay} [Status: ${driver.status}]`);
    });

    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testApplicantRatings();
