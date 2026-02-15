const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Load = require('../models/Load');
const { authMiddleware } = require('../middleware/authMiddleware');
const { createNotification } = require('./notificationRoutes');
const emailService = require('../services/emailNotificationService');

// Customer rates driver
router.post('/customer-rate-driver', authMiddleware, async (req, res) => {
  try {
    const { loadId, driverId, rating, review } = req.body;
    const customerId = req.user.id;

    // Validate
    if (!loadId || !driverId || !rating) {
      return res.status(400).json({ msg: 'Load ID, driver ID, and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    // Check if load exists and is completed
    const load = await Load.findById(loadId);
    if (!load) {
      return res.status(404).json({ msg: 'Load not found' });
    }

    if (load.status !== 'completed') {
      return res.status(400).json({ msg: 'Can only rate completed loads' });
    }

    if (load.customerId.toString() !== customerId) {
      return res.status(403).json({ msg: 'Not authorized to rate this load' });
    }

    // Create or update rating
    let ratingDoc = await Rating.findOne({ loadId });
    
    // Allow editing if already rated
    if (!ratingDoc) {
      ratingDoc = new Rating({
        loadId,
        customerId,
        driverId
      });
    }

    ratingDoc.customerRating = {
      rating,
      review: review || '',
      ratedAt: new Date()
    };

    await ratingDoc.save();

    // Update load's customerRated flag
    await Load.findByIdAndUpdate(loadId, { customerRated: true });

    // Update driver's average rating
    await updateDriverRating(driverId);

    // 🔔 SEND NOTIFICATIONS TO DRIVER
    try {
      const driver = await Driver.findById(driverId);
      const customer = await User.findById(customerId);
      
      if (driver && customer) {
        await createNotification(
          driverId,
          'new_rating',
          'New Rating Received',
          `${customer.name} rated you ${rating} stars`,
          loadId
        );
        
        await emailService.sendNewRatingEmail(
          driver.email,
          driver.name,
          customer.name,
          rating,
          review || '',
          true // isDriver
        );
      }
    } catch (notifError) {
      console.error('Error sending rating notification:', notifError);
    }

    res.json({ msg: 'Rating submitted successfully', rating: ratingDoc });
  } catch (err) {
    console.error('Rating error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Driver rates customer
router.post('/driver-rate-customer', authMiddleware, async (req, res) => {
  try {
    const { loadId, customerId, rating, review } = req.body;
    const driverId = req.user.id;

    // Validate
    if (!loadId || !customerId || !rating) {
      return res.status(400).json({ msg: 'Load ID, customer ID, and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    // Check if load exists and is completed
    const load = await Load.findById(loadId);
    if (!load) {
      return res.status(404).json({ msg: 'Load not found' });
    }

    if (load.status !== 'completed') {
      return res.status(400).json({ msg: 'Can only rate completed loads' });
    }

    if (!load.assignedDriver || load.assignedDriver.driverId.toString() !== driverId) {
      return res.status(403).json({ msg: 'Not authorized to rate this load' });
    }

    // Create or update rating
    let ratingDoc = await Rating.findOne({ loadId });
    
    // Allow editing if already rated
    if (!ratingDoc) {
      ratingDoc = new Rating({
        loadId,
        customerId,
        driverId
      });
    }

    ratingDoc.driverRating = {
      rating,
      review: review || '',
      ratedAt: new Date()
    };

    await ratingDoc.save();

    // Update load's driverRated flag
    await Load.findByIdAndUpdate(loadId, { driverRated: true });

    // Update customer's average rating
    await updateCustomerRating(customerId);

    // 🔔 SEND NOTIFICATIONS TO CUSTOMER
    try {
      const driver = await Driver.findById(driverId);
      const customer = await User.findById(customerId);
      
      if (driver && customer) {
        await createNotification(
          customerId,
          'new_rating',
          'New Rating Received',
          `${driver.name} rated you ${rating} stars`,
          loadId
        );
        
        await emailService.sendNewRatingEmail(
          customer.email,
          customer.name,
          driver.name,
          rating,
          review || '',
          false // isDriver
        );
      }
    } catch (notifError) {
      console.error('Error sending rating notification:', notifError);
    }

    res.json({ msg: 'Rating submitted successfully', rating: ratingDoc });
  } catch (err) {
    console.error('Rating error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get rating for a specific load
router.get('/load/:loadId', authMiddleware, async (req, res) => {
  try {
    const rating = await Rating.findOne({ loadId: req.params.loadId });
    
    if (!rating) {
      return res.status(404).json({ msg: 'No rating found for this load' });
    }
    
    res.json(rating);
  } catch (err) {
    console.error('Get rating error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get driver ratings
router.get('/driver/:driverId', async (req, res) => {
  try {
    const ratings = await Rating.find({
      driverId: req.params.driverId,
      'customerRating.rating': { $exists: true }
    })
    .populate('customerId', 'name')
    .populate('loadId', 'source destination')
    .sort({ 'customerRating.ratedAt': -1 });

    res.json(ratings);
  } catch (err) {
    console.error('Get ratings error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get customer ratings
router.get('/customer/:customerId', async (req, res) => {
  try {
    const ratings = await Rating.find({
      customerId: req.params.customerId,
      'driverRating.rating': { $exists: true }
    })
    .populate('driverId', 'name')
    .populate('loadId', 'source destination')
    .sort({ 'driverRating.ratedAt': -1 });

    res.json(ratings);
  } catch (err) {
    console.error('Get ratings error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Helper function to update driver rating
async function updateDriverRating(driverId) {
  const ratings = await Rating.find({
    driverId,
    'customerRating.rating': { $exists: true }
  });

  if (ratings.length === 0) return;

  const totalRating = ratings.reduce((sum, r) => sum + r.customerRating.rating, 0);
  const averageRating = totalRating / ratings.length;

  await Driver.findByIdAndUpdate(driverId, {
    averageRating: Math.round(averageRating * 10) / 10,
    totalRatings: ratings.length
  });
}

// Helper function to update customer rating
async function updateCustomerRating(customerId) {
  const ratings = await Rating.find({
    customerId,
    'driverRating.rating': { $exists: true }
  });

  if (ratings.length === 0) return;

  const totalRating = ratings.reduce((sum, r) => sum + r.driverRating.rating, 0);
  const averageRating = totalRating / ratings.length;

  await User.findByIdAndUpdate(customerId, {
    averageRating: Math.round(averageRating * 10) / 10,
    totalRatings: ratings.length
  });
}

module.exports = router;
