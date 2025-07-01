const express = require('express');
const router = express.Router();
const Load = require('../models/Load');
const Driver = require('../models/Driver');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');

// Create a new load
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { source, destination, loadType, quantity, estimatedFare } = req.body;
    
    // Validate required fields
    if (!source || !destination || !loadType || !quantity || !estimatedFare) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Create new load
    const newLoad = new Load({
      customerId: req.user.id,
      source,
      destination,
      loadType,
      quantity,
      estimatedFare,
      status: 'pending',
      createdAt: new Date()
    });

    const savedLoad = await newLoad.save();
    res.status(201).json(savedLoad);
  } catch (err) {
    console.error('Load creation error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get all loads for a customer
router.get('/', authMiddleware, async (req, res) => {
  try {
    const loads = await Load.find({ customerId: req.user.id }).sort({ createdAt: -1 });
    res.json(loads);
  } catch (err) {
    console.error('Get loads error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Update a load (mark as completed or cancelled)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (status !== 'completed' && status !== 'cancelled') {
      return res.status(400).json({ msg: 'Invalid status' });
    }

    // Find the load and make sure it belongs to the user
    const load = await Load.findOne({ _id: id, customerId: req.user.id });
    
    if (!load) {
      return res.status(404).json({ msg: 'Load not found or you are not authorized' });
    }

    // Update the load
    load.status = status;
    
    // Set completedAt only for completed loads
    if (status === 'completed') {
      load.completedAt = new Date();
    }
    
    const updatedLoad = await load.save();
    res.json(updatedLoad);
  } catch (err) {
    console.error('Update load error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get applicants for a specific load with their documents
router.get('/:id/applicants', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the load
    const load = await Load.findOne({ 
      _id: id,
      customerId: req.user.id // Ensure the user owns this load
    });
    
    if (!load) {
      return res.status(404).json({ msg: 'Load not found or you are not authorized' });
    }
    
    // If no applicants, return empty array
    if (!load.applicants || load.applicants.length === 0) {
      return res.json([]);
    }
    
    // Get full details for each applicant including documents
    const applicantsWithDetails = await Promise.all(
      load.applicants.map(async (applicant) => {
        try {
          // Find driver in Driver collection to get their documents
          const driver = await Driver.findById(applicant.driverId);
          
          if (driver) {
            // Return driver details with documents
            return {
              driverId: applicant.driverId,
              name: applicant.name || driver.name,
              mobile: applicant.mobile || driver.phone,
              lorryType: applicant.lorryType || driver.lorryType,
              maxCapacity: applicant.maxCapacity || driver.maxCapacity,
              appliedAt: applicant.appliedAt,
              // Include document links
              documents: driver.documents || {}
            };
          }
          
          // Return original applicant data if driver not found
          return applicant;
        } catch (error) {
          console.error(`Error fetching driver details for ${applicant.driverId}:`, error);
          return applicant;
        }
      })
    );
    
    res.json(applicantsWithDetails);
  } catch (err) {
    console.error('Get load applicants error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get all available loads (for drivers)
router.get('/available', authMiddleware, async (req, res) => {
  try {
    console.log('Getting available loads via route handler');
    // Only show pending loads that aren't assigned yet
    const loads = await Load.find({ 
      status: 'pending',
      $or: [
        { assignedDriver: { $exists: false } },
        { 'assignedDriver.driverId': { $exists: false } }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Route handler found ${loads.length} available loads`);
    res.json(loads);
  } catch (err) {
    console.error('Get available loads error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Driver applies for a load
router.post('/:id/apply', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify that the user is a driver
    if (req.user.role !== 'driver') {
      return res.status(403).json({ msg: 'Only drivers can apply for loads' });
    }
    
    // Find the load
    const load = await Load.findById(id);
    if (!load) {
      return res.status(404).json({ msg: 'Load not found' });
    }
    
    // Check if load is still available
    if (load.status !== 'pending') {
      return res.status(400).json({ msg: 'This load is no longer available' });
    }
    
    // Check if driver already applied
    const alreadyApplied = load.applicants.some(
      applicant => applicant.driverId.toString() === req.user.id
    );
    
    if (alreadyApplied) {
      return res.status(400).json({ msg: 'You have already applied for this load' });
    }
    
    // Check if driver already has an assigned load
    const existingAssignedLoad = await Load.findOne({
      'assignedDriver.driverId': req.user.id,
      status: 'assigned'
    });
    
    if (existingAssignedLoad) {
      return res.status(400).json({ 
        msg: 'You already have an assigned load. Complete your current job before applying to a new one.'
      });
    }
    
    // Get driver details
    const driver = await Driver.findById(req.user.id);
    if (!driver) {
      return res.status(404).json({ msg: 'Driver profile not found' });
    }
    
    // Add driver to applicants including documents
    load.applicants.push({
      driverId: req.user.id,
      name: driver.name,
      mobile: driver.phone,
      lorryType: driver.lorryType,
      maxCapacity: driver.maxCapacity,
      appliedAt: new Date(),
      documents: {
        license: driver.documents?.license || null,
        rc: driver.documents?.rc || null,
        fitness: driver.documents?.fitness || null,
        insurance: driver.documents?.insurance || null,
        medical: driver.documents?.medical || null,
        allIndiaPermit: driver.documents?.allIndiaPermit || null
      }
    });
    
    await load.save();
    res.json({ msg: 'Application submitted successfully', load });
  } catch (err) {
    console.error('Apply for load error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Customer assigns a load to a driver
router.put('/:id/assign/:driverId', authMiddleware, async (req, res) => {
  try {
    const { id, driverId } = req.params;
    
    // Find the load and verify ownership
    const load = await Load.findOne({ _id: id, customerId: req.user.id });
    if (!load) {
      return res.status(404).json({ msg: 'Load not found or you are not authorized' });
    }
    
    // Check if load can be assigned
    if (load.status !== 'pending') {
      return res.status(400).json({ msg: 'Only pending loads can be assigned' });
    }
    
    // Find the driver in applicants
    const applicant = load.applicants.find(
      app => app.driverId.toString() === driverId
    );
    
    if (!applicant) {
      return res.status(404).json({ msg: 'This driver has not applied for the load' });
    }
    
    // Check if driver already has an assigned load
    const existingAssignedLoad = await Load.findOne({
      'assignedDriver.driverId': driverId,
      status: 'assigned'
    });
    
    if (existingAssignedLoad) {
      return res.status(400).json({ 
        msg: 'This driver already has an assigned load and cannot be assigned another load until the current one is completed'
      });
    }
    
    // Set assigned driver and update status
    load.assignedDriver = {
      driverId: applicant.driverId,
      name: applicant.name,
      mobile: applicant.mobile,
      lorryType: applicant.lorryType,
      maxCapacity: applicant.maxCapacity,
      assignedAt: new Date()
    };
    
    load.status = 'assigned';
    
    await load.save();
    res.json({ msg: 'Load assigned successfully', load });
  } catch (err) {
    console.error('Assign load error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get loads assigned to a specific driver
router.get('/assigned', authMiddleware, async (req, res) => {
  try {
    // Verify that the user is a driver
    if (req.user.role !== 'driver') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    // Find loads assigned to this driver
    const loads = await Load.find({
      'assignedDriver.driverId': req.user.id,
      status: { $in: ['assigned', 'completed'] }
    }).sort({ createdAt: -1 });
    
    // Add customer details to each load
    const loadsWithCustomerDetails = await Promise.all(
      loads.map(async (load) => {
        try {
          const customer = await User.findById(load.customerId);
          if (customer) {
            return {
              ...load.toObject(),
              customerName: customer.name,
              customerPhone: customer.phone,
              customerEmail: customer.email
            };
          }
          return load;
        } catch (err) {
          console.error(`Error fetching customer details for load ${load._id}:`, err);
          return load;
        }
      })
    );
    
    res.json(loadsWithCustomerDetails);
  } catch (err) {
    console.error('Get assigned loads error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router; 