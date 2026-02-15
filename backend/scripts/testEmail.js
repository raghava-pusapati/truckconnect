require('dotenv').config();
const nodemailer = require('nodemailer');

// Test email configuration
async function testEmail() {
  console.log('Testing email configuration...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    // Verify connection
    console.log('\n1. Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');

    // Send test email
    console.log('\n2. Sending test email...');
    const info = await transporter.sendMail({
      from: `"TruckConnect Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'TruckConnect Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">Email Test Successful!</h2>
          <p>This is a test email from TruckConnect.</p>
          <p>If you received this, your email configuration is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\nCheck your inbox:', process.env.EMAIL_USER);
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.command) console.error('Failed command:', error.command);
  }
}

testEmail();
