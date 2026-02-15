const mongoose = require('mongoose');
const Load = require('../models/Load');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkLoadApplicants() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a load with PUSAPATI RAGHAVENDRA
    const load = await Load.findOne({
      'applicants.name': 'PUSAPATI RAGHAVENDRA'
    });

    if (!load) {
      console.log('❌ No load found');
      return;
    }

    console.log('📦 Load found:', load._id);
    console.log('Applicants array structure:');
    console.log(JSON.stringify(load.applicants, null, 2));
    
    console.log('\n✅ Check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkLoadApplicants();
