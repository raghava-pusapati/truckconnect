const { Resend } = require('resend');

// Get frontend URL from environment or use default
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://truckconnect-frontend.onrender.com';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Verify Resend configuration on startup
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not set in environment variables');
} else {
  console.log('✅ Resend email service initialized');
}

// Email templates
const emailTemplates = {
  loadApplication: (customerName, driverName, loadDetails) => ({
    subject: `New Driver Application - ${loadDetails.source} to ${loadDetails.destination}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706;">New Driver Application</h2>
        <p>Hello ${customerName},</p>
        <p><strong>${driverName}</strong> has applied for your load:</p>
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Route:</strong> ${loadDetails.source} → ${loadDetails.destination}</p>
          <p><strong>Load Type:</strong> ${loadDetails.loadType}</p>
          <p><strong>Quantity:</strong> ${loadDetails.quantity} tons</p>
          <p><strong>Estimated Fare:</strong> ₹${loadDetails.estimatedFare}</p>
        </div>
        <p>Please log in to your dashboard to review the driver's details and assign the load.</p>
        <a href="${FRONTEND_URL}" style="display: inline-block; background-color: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Dashboard</a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">This is an automated email from TruckConnect. Please do not reply.</p>
      </div>
    `
  }),

  loadAssigned: (driverName, customerName, loadDetails) => ({
    subject: `Load Assigned - ${loadDetails.source} to ${loadDetails.destination}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Load Assigned!</h2>
        <p>Hello ${driverName},</p>
        <p>Congratulations! <strong>${customerName}</strong> has assigned you a load:</p>
        <div style="background-color: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Route:</strong> ${loadDetails.source} → ${loadDetails.destination}</p>
          <p><strong>Load Type:</strong> ${loadDetails.loadType}</p>
          <p><strong>Quantity:</strong> ${loadDetails.quantity} tons</p>
          <p><strong>Estimated Fare:</strong> ₹${loadDetails.estimatedFare}</p>
        </div>
        <p>Please log in to your dashboard to view customer details and start the delivery.</p>
        <a href="${FRONTEND_URL}" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Dashboard</a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">This is an automated email from TruckConnect. Please do not reply.</p>
      </div>
    `
  }),

  loadCompleted: (userName, loadDetails, isDriver) => ({
    subject: `Load Completed - ${loadDetails.source} to ${loadDetails.destination}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Load Completed!</h2>
        <p>Hello ${userName},</p>
        <p>The following load has been marked as completed:</p>
        <div style="background-color: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Route:</strong> ${loadDetails.source} → ${loadDetails.destination}</p>
          <p><strong>Load Type:</strong> ${loadDetails.loadType}</p>
          <p><strong>Quantity:</strong> ${loadDetails.quantity} tons</p>
          <p><strong>Fare:</strong> ₹${loadDetails.estimatedFare}</p>
        </div>
        <p>${isDriver ? 'Please rate your experience with the customer.' : 'Please rate your experience with the driver.'}</p>
        <a href="${FRONTEND_URL}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Rate Now</a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">This is an automated email from TruckConnect. Please do not reply.</p>
      </div>
    `
  }),

  newRating: (userName, raterName, rating, comment) => ({
    subject: `New Rating Received - ${rating} Stars`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">New Rating Received!</h2>
        <p>Hello ${userName},</p>
        <p><strong>${raterName}</strong> has rated you:</p>
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Rating:</strong> ${'⭐'.repeat(rating)} (${rating}/5)</p>
          ${comment ? `<p><strong>Comment:</strong> ${comment}</p>` : ''}
        </div>
        <p>Keep up the great work!</p>
        <a href="${FRONTEND_URL}" style="display: inline-block; background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Profile</a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">This is an automated email from TruckConnect. Please do not reply.</p>
      </div>
    `
  }),

  documentExpiry: (driverName, documentType, expiryDate) => ({
    subject: `Document Expiry Alert - ${documentType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Document Expiry Alert</h2>
        <p>Hello ${driverName},</p>
        <p>Your <strong>${documentType}</strong> is expiring soon:</p>
        <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Document:</strong> ${documentType}</p>
          <p><strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString()}</p>
        </div>
        <p>Please update your document to continue receiving load assignments.</p>
        <a href="${FRONTEND_URL}" style="display: inline-block; background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Update Document</a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">This is an automated email from TruckConnect. Please do not reply.</p>
      </div>
    `
  }),

  driverApproved: (driverName) => ({
    subject: 'Application Approved - Welcome to TruckConnect!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Application Approved!</h2>
        <p>Hello ${driverName},</p>
        <p>Congratulations! Your driver application has been approved.</p>
        <div style="background-color: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p>You can now:</p>
          <ul>
            <li>Browse available loads</li>
            <li>Apply for loads that match your vehicle capacity</li>
            <li>Start earning with TruckConnect</li>
          </ul>
        </div>
        <a href="${FRONTEND_URL}" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Start Browsing Loads</a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">This is an automated email from TruckConnect. Please do not reply.</p>
      </div>
    `
  }),

  driverRejected: (driverName, reason) => ({
    subject: 'Application Status Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Application Status Update</h2>
        <p>Hello ${driverName},</p>
        <p>Thank you for your interest in TruckConnect. Unfortunately, we are unable to approve your application at this time.</p>
        ${reason ? `<div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Reason:</strong> ${reason}</p>
        </div>` : ''}
        <p>If you have any questions, please contact our support team.</p>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">This is an automated email from TruckConnect. Please do not reply.</p>
      </div>
    `
  })
};

// Send email function using Resend
const sendEmail = async (to, template) => {
  // Send email in background (non-blocking)
  setImmediate(async () => {
    try {
      // TEMPORARY: For Resend free tier without domain verification,
      // send all emails to the verified email for testing
      const testMode = !process.env.RESEND_DOMAIN_VERIFIED;
      const recipientEmail = testMode ? 'truckconnect.team@gmail.com' : to;
      
      if (testMode && to !== 'truckconnect.team@gmail.com') {
        console.log(`📧 TEST MODE: Email for ${to} redirected to truckconnect.team@gmail.com`);
        console.log(`� Subject: ${template.subject}`);
      }
      
      const { data, error } = await resend.emails.send({
        from: 'TruckConnect <onboarding@resend.dev>',
        to: [recipientEmail],
        subject: testMode && to !== recipientEmail ? `[TEST for ${to}] ${template.subject}` : template.subject,
        html: template.html,
      });

      if (error) {
        console.error('❌ Error sending email:', error);
        console.log('💡 To send to all users, verify your domain at: https://resend.com/domains');
      } else {
        console.log('✅ Email sent successfully:', data.id);
      }
    } catch (error) {
      console.error('❌ Error sending email:', error.message);
    }
  });
  
  // Return immediately without waiting for email
  return { success: true, queued: true };
};

module.exports = {
  sendLoadApplicationEmail: async (customerEmail, customerName, driverName, loadDetails) => {
    const template = emailTemplates.loadApplication(customerName, driverName, loadDetails);
    return await sendEmail(customerEmail, template);
  },

  sendLoadAssignedEmail: async (driverEmail, driverName, customerName, loadDetails) => {
    const template = emailTemplates.loadAssigned(driverName, customerName, loadDetails);
    return await sendEmail(driverEmail, template);
  },

  sendLoadCompletedEmail: async (userEmail, userName, loadDetails, isDriver) => {
    const template = emailTemplates.loadCompleted(userName, loadDetails, isDriver);
    return await sendEmail(userEmail, template);
  },

  sendNewRatingEmail: async (userEmail, userName, raterName, rating, comment, isDriver) => {
    const template = emailTemplates.newRating(userName, raterName, rating, comment);
    return await sendEmail(userEmail, template);
  },

  sendDocumentExpiryEmail: async (driverEmail, driverName, documentType, expiryDate) => {
    const template = emailTemplates.documentExpiry(driverName, documentType, expiryDate);
    return await sendEmail(driverEmail, template);
  },

  sendDriverApprovedEmail: async (driverEmail, driverName) => {
    const template = emailTemplates.driverApproved(driverName);
    return await sendEmail(driverEmail, template);
  },

  sendDriverRejectedEmail: async (driverEmail, driverName, reason) => {
    const template = emailTemplates.driverRejected(driverName, reason);
    return await sendEmail(driverEmail, template);
  }
};
