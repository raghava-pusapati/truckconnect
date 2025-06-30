const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const { authMiddleware } = require('../middleware/authMiddleware');

// Middleware to check if user is an admin
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Admin only.' });
  }
  next();
};

// Apply authentication and admin authorization
router.use(authMiddleware);
router.use(authorizeAdmin);

// Get all drivers
router.get('/drivers', async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending drivers
router.get('/drivers/pending', async (req, res) => {
  try {
    const drivers = await Driver.find({ status: 'pending' });
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching pending drivers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get accepted drivers
router.get('/drivers/accepted', async (req, res) => {
  try {
    const drivers = await Driver.find({ status: 'accepted' });
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching accepted drivers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get rejected drivers
router.get('/drivers/rejected', async (req, res) => {
  try {
    const drivers = await Driver.find({ status: 'rejected' });
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching rejected drivers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept driver
router.put('/drivers/:id/accept', async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { status: 'accepted' },
      { new: true }
    );
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    res.json(driver);
  } catch (error) {
    console.error('Error accepting driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject driver
router.put('/drivers/:id/reject', async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        rejectionReason
      },
      { new: true }
    );
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    res.json(driver);
  } catch (error) {
    console.error('Error rejecting driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;