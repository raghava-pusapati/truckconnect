const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Load = require('../models/Load');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Rating = require('../models/Rating');
const { authMiddleware } = require('../middleware/authMiddleware');

// Customer Analytics
router.get('/customer', authMiddleware, async (req, res) => {
  try {
    const customerId = req.user.id;

    // Total loads
    const totalLoads = await Load.countDocuments({ customerId });
    
    // Loads by status
    const pending = await Load.countDocuments({ customerId, status: 'pending' });
    const assigned = await Load.countDocuments({ customerId, status: 'assigned' });
    const completed = await Load.countDocuments({ customerId, status: 'completed' });
    const cancelled = await Load.countDocuments({ customerId, status: 'cancelled' });

    // Total spending
    const completedLoads = await Load.find({ customerId, status: 'completed' });
    const totalSpending = completedLoads.reduce((sum, load) => sum + load.estimatedFare, 0);

    // Average delivery time (in days)
    const loadsWithTime = completedLoads.filter(load => load.completedAt);
    const avgDeliveryTime = loadsWithTime.length > 0
      ? loadsWithTime.reduce((sum, load) => {
          const days = (new Date(load.completedAt) - new Date(load.createdAt)) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / loadsWithTime.length
      : 0;

    // Monthly spending (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyData = await Load.aggregate([
      {
        $match: {
          customerId: new mongoose.Types.ObjectId(customerId),
          status: 'completed',
          completedAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$completedAt' },
            month: { $month: '$completedAt' }
          },
          spending: { $sum: '$estimatedFare' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalLoads,
      loadsByStatus: { pending, assigned, completed, cancelled },
      totalSpending,
      avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
      monthlyData
    });
  } catch (err) {
    console.error('Customer analytics error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Driver Analytics
router.get('/driver', authMiddleware, async (req, res) => {
  try {
    const driverId = req.user.id;

    // Total loads completed
    const completedLoads = await Load.find({
      'assignedDriver.driverId': driverId,
      status: 'completed'
    });

    const totalLoads = completedLoads.length;
    const totalEarnings = completedLoads.reduce((sum, load) => sum + load.estimatedFare, 0);

    // Current assigned loads
    const assignedLoads = await Load.countDocuments({
      'assignedDriver.driverId': driverId,
      status: 'assigned'
    });

    // Average rating
    const driver = await Driver.findById(driverId);
    const averageRating = driver.averageRating || 0;
    const totalRatings = driver.totalRatings || 0;

    // Monthly earnings (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyData = await Load.aggregate([
      {
        $match: {
          'assignedDriver.driverId': new mongoose.Types.ObjectId(driverId),
          status: 'completed',
          completedAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$completedAt' },
            month: { $month: '$completedAt' }
          },
          earnings: { $sum: '$estimatedFare' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalLoads,
      totalEarnings,
      assignedLoads,
      averageRating,
      totalRatings,
      monthlyData
    });
  } catch (err) {
    console.error('Driver analytics error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Admin Analytics
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Total counts
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalDrivers = await Driver.countDocuments();
    const totalLoads = await Load.countDocuments();

    // Drivers by status
    const pendingDrivers = await Driver.countDocuments({ status: 'pending' });
    const acceptedDrivers = await Driver.countDocuments({ status: 'accepted' });
    const rejectedDrivers = await Driver.countDocuments({ status: 'rejected' });

    // Loads by status
    const pendingLoads = await Load.countDocuments({ status: 'pending' });
    const assignedLoads = await Load.countDocuments({ status: 'assigned' });
    const completedLoads = await Load.countDocuments({ status: 'completed' });
    const cancelledLoads = await Load.countDocuments({ status: 'cancelled' });

    // Total platform revenue (assuming 10% commission)
    const allCompletedLoads = await Load.find({ status: 'completed' });
    const totalRevenue = allCompletedLoads.reduce((sum, load) => sum + load.estimatedFare, 0);
    const platformRevenue = totalRevenue * 0.1; // 10% commission

    // Monthly stats (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyLoads = await Load.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthlyRevenue = await Load.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$completedAt' },
            month: { $month: '$completedAt' }
          },
          revenue: { $sum: '$estimatedFare' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalCustomers,
      totalDrivers,
      totalLoads,
      driversByStatus: { pending: pendingDrivers, accepted: acceptedDrivers, rejected: rejectedDrivers },
      loadsByStatus: { pending: pendingLoads, assigned: assignedLoads, completed: completedLoads, cancelled: cancelledLoads },
      totalRevenue,
      platformRevenue,
      monthlyLoads,
      monthlyRevenue
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
