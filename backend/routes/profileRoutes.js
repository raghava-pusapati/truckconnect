const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Driver = require('../models/Driver');
const { authMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage for profile pictures
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'truckconnect/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 300, height: 300, crop: 'fill', quality: 'auto:good' }],
    // Optimize for faster uploads
    resource_type: 'auto',
    format: 'jpg' // Convert all to JPG for consistency and smaller size
  }
});

const upload = multer({ storage });

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    let profile;
    
    if (req.user.role === 'driver') {
      profile = await Driver.findById(req.user.id).select('-password');
    } else {
      profile = await User.findById(req.user.id).select('-password');
    }
    
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update user profile (customer/admin)
router.put('/user', authMiddleware, async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Update user profile error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update driver profile
router.put('/driver', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    const { name, phone, address, lorryType, maxCapacity } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (lorryType) updateData.lorryType = lorryType;
    if (maxCapacity) updateData.maxCapacity = maxCapacity;
    
    const driver = await Driver.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!driver) {
      return res.status(404).json({ msg: 'Driver not found' });
    }
    
    res.json(driver);
  } catch (err) {
    console.error('Update driver profile error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Upload profile picture
router.post('/upload-picture', authMiddleware, upload.single('profilePicture'), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('User:', req.user);
    console.log('File:', req.file);

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    
    const profilePictureUrl = req.file.path;
    console.log('File uploaded to Cloudinary:', profilePictureUrl);
    
    let profile;
    if (req.user.role === 'driver') {
      console.log('Updating driver profile picture');
      profile = await Driver.findByIdAndUpdate(
        req.user.id,
        { profilePicture: profilePictureUrl },
        { new: true }
      ).select('-password');
    } else {
      console.log('Updating user profile picture');
      profile = await User.findByIdAndUpdate(
        req.user.id,
        { profilePicture: profilePictureUrl },
        { new: true }
      ).select('-password');
    }
    
    if (!profile) {
      console.error('Profile not found after update');
      return res.status(404).json({ msg: 'Profile not found' });
    }

    console.log('Profile updated successfully:', profile._id);
    res.json({ 
      msg: 'Profile picture uploaded successfully',
      profilePictureUrl,
      profile
    });
  } catch (err) {
    console.error('Upload profile picture error:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

// Get user's own ratings
router.get('/my-ratings', authMiddleware, async (req, res) => {
  try {
    const Rating = require('../models/Rating');
    let ratings;
    
    if (req.user.role === 'driver') {
      // Get ratings where this driver was rated by customers
      ratings = await Rating.find({
        driverId: req.user.id,
        'customerRating.rating': { $exists: true }
      })
      .populate('customerId', 'name')
      .populate('loadId', 'source destination')
      .sort({ 'customerRating.ratedAt': -1 });
    } else {
      // Get ratings where this customer was rated by drivers
      ratings = await Rating.find({
        customerId: req.user.id,
        'driverRating.rating': { $exists: true }
      })
      .populate('driverId', 'name')
      .populate('loadId', 'source destination')
      .sort({ 'driverRating.ratedAt': -1 });
    }
    
    res.json(ratings);
  } catch (err) {
    console.error('Get my ratings error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get rating breakdown (star distribution)
router.get('/rating-breakdown', authMiddleware, async (req, res) => {
  try {
    const Rating = require('../models/Rating');
    let ratings;
    
    if (req.user.role === 'driver') {
      ratings = await Rating.find({
        driverId: req.user.id,
        'customerRating.rating': { $exists: true }
      });
      
      const breakdown = {
        5: 0, 4: 0, 3: 0, 2: 0, 1: 0
      };
      
      ratings.forEach(r => {
        const rating = r.customerRating.rating;
        breakdown[rating]++;
      });
      
      res.json(breakdown);
    } else {
      ratings = await Rating.find({
        customerId: req.user.id,
        'driverRating.rating': { $exists: true }
      });
      
      const breakdown = {
        5: 0, 4: 0, 3: 0, 2: 0, 1: 0
      };
      
      ratings.forEach(r => {
        const rating = r.driverRating.rating;
        breakdown[rating]++;
      });
      
      res.json(breakdown);
    }
  } catch (err) {
    console.error('Get rating breakdown error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
