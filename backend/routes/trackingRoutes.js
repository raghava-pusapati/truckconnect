const express = require('express');
const router = express.Router();
const Load = require('../models/Load');
const { authMiddleware } = require('../middleware/authMiddleware');

// Start tracking for a load
router.post('/start/:loadId', authMiddleware, async (req, res) => {
  try {
    const { loadId } = req.params;
    const { latitude, longitude } = req.body;

    // Verify that the user is a driver
    if (req.user.role !== 'driver') {
      return res.status(403).json({ msg: 'Only drivers can start tracking' });
    }

    // Find the load and verify it's assigned to this driver
    const load = await Load.findOne({
      _id: loadId,
      'assignedDriver.driverId': req.user.id,
      status: 'assigned'
    });

    if (!load) {
      return res.status(404).json({ msg: 'Load not found or not assigned to you' });
    }

    // Start tracking
    load.tracking = {
      isActive: true,
      startedAt: new Date(),
      currentLocation: {
        latitude,
        longitude,
        timestamp: new Date()
      },
      locationHistory: [{
        latitude,
        longitude,
        timestamp: new Date()
      }]
    };

    await load.save();

    res.json({ msg: 'Tracking started successfully', tracking: load.tracking });
  } catch (err) {
    console.error('Start tracking error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Update driver location
router.put('/update/:loadId', authMiddleware, async (req, res) => {
  try {
    const { loadId } = req.params;
    const { latitude, longitude } = req.body;

    // Verify that the user is a driver
    if (req.user.role !== 'driver') {
      return res.status(403).json({ msg: 'Only drivers can update tracking' });
    }

    // Find the load
    const load = await Load.findOne({
      _id: loadId,
      'assignedDriver.driverId': req.user.id
    });

    if (!load) {
      return res.status(404).json({ msg: 'Load not found or not assigned to you' });
    }

    if (!load.tracking || !load.tracking.isActive) {
      return res.status(400).json({ msg: 'Tracking not started for this load' });
    }

    // Update current location
    load.tracking.currentLocation = {
      latitude,
      longitude,
      timestamp: new Date()
    };

    // Add to location history
    load.tracking.locationHistory.push({
      latitude,
      longitude,
      timestamp: new Date()
    });

    // 🚨 CRITICAL: Limit location history to prevent MongoDB document size issues
    // Keep only last 1000 points (should be enough for any trip)
    if (load.tracking.locationHistory.length > 1000) {
      load.tracking.locationHistory = load.tracking.locationHistory.slice(-1000);
      console.log(`Trimmed location history for load ${loadId} to 1000 points`);
    }

    await load.save();

    res.json({ msg: 'Location updated successfully', location: load.tracking.currentLocation });
  } catch (err) {
    console.error('Update tracking error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Stop tracking
router.post('/stop/:loadId', authMiddleware, async (req, res) => {
  try {
    const { loadId } = req.params;

    // Verify that the user is a driver
    if (req.user.role !== 'driver') {
      return res.status(403).json({ msg: 'Only drivers can stop tracking' });
    }

    // Find the load
    const load = await Load.findOne({
      _id: loadId,
      'assignedDriver.driverId': req.user.id
    });

    if (!load) {
      return res.status(404).json({ msg: 'Load not found or not assigned to you' });
    }

    // Stop tracking
    if (load.tracking) {
      load.tracking.isActive = false;
    }

    await load.save();

    res.json({ msg: 'Tracking stopped successfully' });
  } catch (err) {
    console.error('Stop tracking error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Support GET method for sendBeacon compatibility (with token in query)
router.get('/stop/:loadId', async (req, res) => {
  try {
    const { loadId } = req.params;
    const token = req.query.token || req.headers['x-auth-token'];
    
    if (!token) {
      return res.status(401).json({ msg: 'No token provided' });
    }

    // Verify token manually
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.user.role !== 'driver') {
      return res.status(403).json({ msg: 'Only drivers can stop tracking' });
    }

    const load = await Load.findOne({
      _id: loadId,
      'assignedDriver.driverId': decoded.user.id
    });

    if (!load) {
      return res.status(404).json({ msg: 'Load not found or not assigned to you' });
    }

    if (load.tracking) {
      load.tracking.isActive = false;
    }

    await load.save();

    res.json({ msg: 'Tracking stopped successfully (sendBeacon)' });
  } catch (err) {
    console.error('Stop tracking error (sendBeacon):', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get tracking info (for customers)
router.get('/:loadId', authMiddleware, async (req, res) => {
  try {
    const { loadId } = req.params;

    // Find the load
    const load = await Load.findOne({ _id: loadId });

    if (!load) {
      return res.status(404).json({ msg: 'Load not found' });
    }

    // Verify authorization - customer must own the load or driver must be assigned
    const isCustomer = req.user.role === 'customer' && load.customerId.toString() === req.user.id;
    const isDriver = req.user.role === 'driver' && load.assignedDriver?.driverId?.toString() === req.user.id;

    if (!isCustomer && !isDriver) {
      return res.status(403).json({ msg: 'Not authorized to view this tracking information' });
    }

    res.json({
      tracking: load.tracking || null,
      source: load.source,
      destination: load.destination,
      driverName: load.assignedDriver?.name || 'Unknown',
      driverMobile: load.assignedDriver?.mobile || 'N/A'
    });
  } catch (err) {
    console.error('Get tracking error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
