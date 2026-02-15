const mongoose = require('mongoose');
const Load = require('../models/Load');
const Driver = require('../models/Driver');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrateRatings() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Migrating ratings to Load.applicants...\n');

    // Find all loads with applicants
    const loads = await Load.find({
      'applicants.0': { $exists: true }
    });

    console.log(`Found ${loads.length} loads with applicants\n`);

    let updated = 0;

    for (const load of loads) {
      let modified = false;

      // Update each applicant with ratings
      for (let i = 0; i < load.applicants.length; i++) {
        const applicant = load.applicants[i];
        
        console.log(`Checking applicant ${applicant.name}: averageRating=${applicant.averageRating}, totalRatings=${applicant.totalRatings}`);
        
        // Always update to get latest ratings
        const driver = await Driver.findById(applicant.driverId);
        
        if (driver) {
          load.applicants[i].averageRating = driver.averageRating || 0;
          load.applicants[i].totalRatings = driver.totalRatings || 0;
          modified = true;
          console.log(`  ✅ Updated ${applicant.name}: ${driver.averageRating} ⭐ (${driver.totalRatings})`);
        }
      }

      // Update assignedDriver if exists
      if (load.assignedDriver && load.assignedDriver.driverId) {
        const driver = await Driver.findById(load.assignedDriver.driverId);
        
        if (driver) {
          load.assignedDriver.averageRating = driver.averageRating || 0;
          load.assignedDriver.totalRatings = driver.totalRatings || 0;
          modified = true;
          console.log(`  ✅ Updated assigned driver ${load.assignedDriver.name}: ${driver.averageRating} ⭐`);
        }
      }

      if (modified) {
        await load.save();
        updated++;
        console.log(`📦 Updated load ${load._id}\n`);
      }
    }

    console.log(`\n✅ Migration complete! Updated ${updated} loads`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

migrateRatings();
