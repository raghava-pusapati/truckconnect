const nodemailer = require('nodemailer');

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD
  }
});

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
        <a href="http://localhost:5173" style="display: inline-block; background-color: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Dashboard</a>
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
        <a href="http://localhost:5173" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Dashboard</a>
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
        <a href="http://localhost:5173" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Rate Now</a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">This is an automated email from TruckConnect. Please do not reply.</p>
      </div>
    `
  }),

  newRating: (userName, raterName, rating, comment, isDriver) => ({
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
        <a href="http://localhost:5173" style="display: inline-block; background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Profile</a>
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
        <a href="http://localhost:5173" style="display: inline-block; background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Update Document</a>
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
        <a href="http://localhost:5173" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Start Browsing Loads</a>
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

// Send email function
const sendEmail = async (to, template) => {
  try {
    const mailOptions = {
      from: `"TruckConnect" <${process.env.EMAIL_USER}>`,
      to,
      subject: template.subject,
      html: template.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
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
    const template = emailTemplates.newRating(userName, raterName, rating, comment, isDriver);
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
