require('dotenv').config({ path: '../.env' });
const emailService = require('../services/emailNotificationService');

async function testEmailService() {
  console.log('=================================');
  console.log('Testing Email Service');
  console.log('=================================');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***configured***' : 'NOT SET');
  console.log('=================================\n');

  // Test 1: Load Application Email
  console.log('Test 1: Sending Load Application Email...');
  try {
    const result1 = await emailService.sendLoadApplicationEmail(
      'raghava@example.com', // Replace with your test email
      'Raghava',
      'Test Driver',
      {
        source: 'Hyderabad',
        destination: 'Bangalore',
        loadType: 'Electronics',
        quantity: 10,
        estimatedFare: 50000
      }
    );
    console.log('✅ Load Application Email:', result1.success ? 'SUCCESS' : 'FAILED');
    if (!result1.success) console.log('Error:', result1.error);
  } catch (error) {
    console.log('❌ Load Application Email FAILED:', error.message);
  }
  console.log('');

  // Test 2: Load Assigned Email
  console.log('Test 2: Sending Load Assigned Email...');
  try {
    const result2 = await emailService.sendLoadAssignedEmail(
      'driver@example.com', // Replace with your test email
      'Test Driver',
      'Raghava',
      {
        source: 'Hyderabad',
        destination: 'Bangalore',
        loadType: 'Electronics',
        quantity: 10,
        estimatedFare: 50000
      }
    );
    console.log('✅ Load Assigned Email:', result2.success ? 'SUCCESS' : 'FAILED');
    if (!result2.success) console.log('Error:', result2.error);
  } catch (error) {
    console.log('❌ Load Assigned Email FAILED:', error.message);
  }
  console.log('');

  // Test 3: Load Completed Email
  console.log('Test 3: Sending Load Completed Email...');
  try {
    const result3 = await emailService.sendLoadCompletedEmail(
      'customer@example.com', // Replace with your test email
      'Raghava',
      {
        source: 'Hyderabad',
        destination: 'Bangalore',
        loadType: 'Electronics',
        quantity: 10,
        estimatedFare: 50000
      },
      false // isDriver
    );
    console.log('✅ Load Completed Email:', result3.success ? 'SUCCESS' : 'FAILED');
    if (!result3.success) console.log('Error:', result3.error);
  } catch (error) {
    console.log('❌ Load Completed Email FAILED:', error.message);
  }
  console.log('');

  // Test 4: New Rating Email
  console.log('Test 4: Sending New Rating Email...');
  try {
    const result4 = await emailService.sendNewRatingEmail(
      'driver@example.com', // Replace with your test email
      'Test Driver',
      'Raghava',
      5,
      'Excellent service!',
      true // isDriver
    );
    console.log('✅ New Rating Email:', result4.success ? 'SUCCESS' : 'FAILED');
    if (!result4.success) console.log('Error:', result4.error);
  } catch (error) {
    console.log('❌ New Rating Email FAILED:', error.message);
  }
  console.log('');

  // Test 5: Driver Approved Email
  console.log('Test 5: Sending Driver Approved Email...');
  try {
    const result5 = await emailService.sendDriverApprovedEmail(
      'driver@example.com', // Replace with your test email
      'Test Driver'
    );
    console.log('✅ Driver Approved Email:', result5.success ? 'SUCCESS' : 'FAILED');
    if (!result5.success) console.log('Error:', result5.error);
  } catch (error) {
    console.log('❌ Driver Approved Email FAILED:', error.message);
  }
  console.log('');

  console.log('=================================');
  console.log('Email Service Test Complete');
  console.log('=================================');
}

testEmailService().then(() => {
  console.log('\nTest completed. Check your email inbox.');
  process.exit(0);
}).catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});
