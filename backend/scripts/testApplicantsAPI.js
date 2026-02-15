const mongoose = require('mongoose');
const Load = require('../models/Load');
const Driver = require('../models/Driver');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testApplicantsAPI() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a load with PUSAPATI RAGHAVENDRA as applicant
    const load = await Load.findOne({
      'applicants.name': 'PUSAPATI RAGHAVENDRA'
    });

    if (!load) {
      console.log('❌ No load found with PUSAPATI RAGHAVENDRA as applicant');
      return;
    }

    console.log(`📦 Found Load: ${load._id}`);
    console.log(`   Source: ${load.source} → ${load.destination}`);
    console.log(`   Applicants: ${load.applicants.length}\n`);

    // Simulate the API endpoint logic
    console.log('🔄 Simulating API endpoint /api/loads/:id/applicants\n');

    const applicantsWithDetails = await Promise.all(
      load.applicants.map(async (applicant) => {
        console.log(`Processing applicant: ${applicant.name}`);
        console.log(`  Driver ID: ${applicant.driverId}`);
        
        try {
          const driver = await Driver.findById(applicant.driverId);
          
          if (driver) {
            console.log(`  ✅ Driver found in DB`);
            console.log(`  Driver averageRating: ${driver.averageRating}`);
            console.log(`  Driver totalRatings: ${driver.totalRatings}`);
            
            const result = {
              driverId: applicant.driverId,
              name: applicant.name || driver.name,
              mobile: applicant.mobile || driver.phone,
              lorryType: applicant.lorryType || driver.lorryType,
              maxCapacity: applicant.maxCapacity || driver.maxCapacity,
              appliedAt: applicant.appliedAt,
              averageRating: driver.averageRating || 0,
              totalRatings: driver.totalRatings || 0,
              documents: driver.documents || {}
            };
            
            console.log(`  Result object:`);
            console.log(`    averageRating: ${result.averageRating}`);
            console.log(`    totalRatings: ${result.totalRatings}\n`);
            
            return result;
          } else {
            console.log(`  ❌ Driver NOT found in DB\n`);
            return applicant;
          }
        } catch (error) {
          console.error(`  ❌ Error fetching driver:`, error.message);
          return applicant;
        }
      })
    );

    console.log('\n📊 Final API Response:');
    console.log(JSON.stringify(applicantsWithDetails, null, 2));

    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testApplicantsAPI();
