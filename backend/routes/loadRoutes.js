const express = require('express');
const router = express.Router();
const Load = require('../models/Load');
const Driver = require('../models/Driver');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');
const { createNotification } = require('./notificationRoutes');
const emailService = require('../services/emailNotificationService');

// Create a new load
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { source, destination, loadType, quantity, estimatedFare, description, estimatedDeliveryDate } = req.body;
    
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
      description: description || '',
      estimatedDeliveryDate: estimatedDeliveryDate || null,
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
    
    // Add driver ratings for assigned loads
    const loadsWithDriverRatings = await Promise.all(
      loads.map(async (load) => {
        const loadObj = load.toObject();
        
        // If load is assigned and has a driver, fetch driver's rating
        if (loadObj.assignedDriver && loadObj.assignedDriver.driverId) {
          try {
            const driver = await Driver.findById(loadObj.assignedDriver.driverId);
            if (driver) {
              loadObj.assignedDriver.averageRating = driver.averageRating || 0;
              loadObj.assignedDriver.totalRatings = driver.totalRatings || 0;
            }
          } catch (err) {
            console.error(`Error fetching driver rating for ${loadObj.assignedDriver.driverId}:`, err);
          }
        }
        
        return loadObj;
      })
    );
    
    res.json(loadsWithDriverRatings);
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
    
    // 🔔 SEND NOTIFICATIONS WHEN LOAD COMPLETED
    if (status === 'completed' && load.assignedDriver) {
      try {
        const driver = await Driver.findById(load.assignedDriver.driverId);
        const customer = await User.findById(req.user.id);
        
        if (driver && customer) {
          // Notify driver
          await createNotification(
            load.assignedDriver.driverId,
            'load_completed',
            'Load Completed',
            `Load from ${load.source} to ${load.destination} has been marked as completed`,
            load._id
          );
          
          await emailService.sendLoadCompletedEmail(
            driver.email,
            driver.name,
            {
              source: load.source,
              destination: load.destination,
              loadType: load.loadType,
              quantity: load.quantity,
              estimatedFare: load.estimatedFare
            },
            true // isDriver
          );
          
          // Notify customer
          await createNotification(
            req.user.id,
            'load_completed',
            'Load Completed',
            `Your load from ${load.source} to ${load.destination} has been completed`,
            load._id
          );
          
          await emailService.sendLoadCompletedEmail(
            customer.email,
            customer.name,
            {
              source: load.source,
              destination: load.destination,
              loadType: load.loadType,
              quantity: load.quantity,
              estimatedFare: load.estimatedFare
            },
            false // isDriver
          );
        }
      } catch (notifError) {
        console.error('Error sending completion notifications:', notifError);
      }
    }
    
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
    
    console.log(`========================================`);
    console.log(`[APPLICANTS API] Fetching applicants for load: ${id}`);
    console.log(`========================================`);
    
    // Find the load
    const load = await Load.findOne({ 
      _id: id,
      customerId: req.user.id // Ensure the user owns this load
    });
    
    if (!load) {
      console.log(`[APPLICANTS API] Load not found or unauthorized`);
      return res.status(404).json({ msg: 'Load not found or you are not authorized' });
    }
    
    console.log(`[APPLICANTS API] Load found with ${load.applicants?.length || 0} applicants`);
    
    // If no applicants, return empty array
    if (!load.applicants || load.applicants.length === 0) {
      console.log(`[APPLICANTS API] No applicants, returning empty array`);
      return res.json([]);
    }
    
    // Get full details for each applicant including documents and ratings
    const applicantsWithDetails = await Promise.all(
      load.applicants.map(async (applicant) => {
        try {
          console.log(`[APPLICANTS API] Processing applicant: ${applicant.name}, ID: ${applicant.driverId}`);
          
          // Find driver in Driver collection to get their documents and ratings
          const driver = await Driver.findById(applicant.driverId);
          
          if (driver) {
            console.log(`[APPLICANTS API] Driver found: ${driver.name}`);
            console.log(`[APPLICANTS API] Driver averageRating: ${driver.averageRating}`);
            console.log(`[APPLICANTS API] Driver totalRatings: ${driver.totalRatings}`);
            
            // Return driver details with documents and ratings
            const result = {
              driverId: applicant.driverId,
              name: applicant.name || driver.name,
              mobile: applicant.mobile || driver.phone,
              lorryType: applicant.lorryType || driver.lorryType,
              maxCapacity: applicant.maxCapacity || driver.maxCapacity,
              appliedAt: applicant.appliedAt,
              // Include ratings
              averageRating: driver.averageRating || 0,
              totalRatings: driver.totalRatings || 0,
              // Include document links
              documents: driver.documents || {}
            };
            
            console.log(`[APPLICANTS API] Returning applicant with rating: ${result.averageRating}`);
            return result;
          }
          
          console.log(`[APPLICANTS API] Driver not found in database`);
          // Return original applicant data if driver not found
          return applicant;
        } catch (error) {
          console.error(`[APPLICANTS API] Error fetching driver details for ${applicant.driverId}:`, error);
          return applicant;
        }
      })
    );
    
    console.log(`[APPLICANTS API] Sending response with ${applicantsWithDetails.length} applicants`);
    console.log(`[APPLICANTS API] Response data:`, JSON.stringify(applicantsWithDetails, null, 2));
    
    res.json(applicantsWithDetails);
  } catch (err) {
    console.error('[APPLICANTS API] Error:', err.message);
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
    
    // Add driver to applicants including documents AND RATINGS
    load.applicants.push({
      driverId: req.user.id,
      name: driver.name,
      mobile: driver.phone,
      lorryType: driver.lorryType,
      maxCapacity: driver.maxCapacity,
      appliedAt: new Date(),
      averageRating: driver.averageRating || 0,
      totalRatings: driver.totalRatings || 0,
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
    
    // 🔔 SEND NOTIFICATIONS TO CUSTOMER
    try {
      const customer = await User.findById(load.customerId);
      if (customer) {
        // Create in-app notification
        await createNotification(
          load.customerId,
          'load_application',
          'New Driver Application',
          `${driver.name} has applied for your load from ${load.source} to ${load.destination}`,
          load._id
        );
        
        // Send email notification
        await emailService.sendLoadApplicationEmail(
          customer.email,
          customer.name,
          driver.name,
          {
            source: load.source,
            destination: load.destination,
            loadType: load.loadType,
            quantity: load.quantity,
            estimatedFare: load.estimatedFare
          }
        );
      }
    } catch (notifError) {
      console.error('Error sending notifications:', notifError);
      // Don't fail the request if notification fails
    }
    
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
    
    // Set assigned driver and update status INCLUDING RATINGS
    load.assignedDriver = {
      driverId: applicant.driverId,
      name: applicant.name,
      mobile: applicant.mobile,
      lorryType: applicant.lorryType,
      maxCapacity: applicant.maxCapacity,
      assignedAt: new Date(),
      averageRating: applicant.averageRating || 0,
      totalRatings: applicant.totalRatings || 0
    };
    
    load.status = 'assigned';
    
    await load.save();
    
    // 🔔 SEND NOTIFICATIONS TO DRIVER
    try {
      const driver = await Driver.findById(driverId);
      const customer = await User.findById(req.user.id);
      
      if (driver && customer) {
        // Create in-app notification
        await createNotification(
          driverId,
          'load_assigned',
          'Load Assigned!',
          `You have been assigned a load from ${load.source} to ${load.destination}`,
          load._id
        );
        
        // Send email notification
        await emailService.sendLoadAssignedEmail(
          driver.email,
          driver.name,
          customer.name,
          {
            source: load.source,
            destination: load.destination,
            loadType: load.loadType,
            quantity: load.quantity,
            estimatedFare: load.estimatedFare
          }
        );
      }
    } catch (notifError) {
      console.error('Error sending notifications:', notifError);
    }
    
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
    
    // Add customer details and ratings to each load
    const loadsWithCustomerDetails = await Promise.all(
      loads.map(async (load) => {
        try {
          const customer = await User.findById(load.customerId);
          if (customer) {
            return {
              ...load.toObject(),
              customerName: customer.name,
              customerPhone: customer.phone,
              customerEmail: customer.email,
              customerDetails: {
                id: customer._id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                averageRating: customer.averageRating || 0,
                totalRatings: customer.totalRatings || 0
              }
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

// Edit a pending load
router.put('/:id/edit', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { source, destination, loadType, quantity, estimatedFare, description, estimatedDeliveryDate } = req.body;
    
    // Find the load and verify ownership
    const load = await Load.findOne({ _id: id, customerId: req.user.id });
    
    if (!load) {
      return res.status(404).json({ msg: 'Load not found or you are not authorized' });
    }
    
    // Only allow editing pending loads
    if (load.status !== 'pending') {
      return res.status(400).json({ msg: 'Only pending loads can be edited' });
    }
    
    // Update fields
    if (source) load.source = source;
    if (destination) load.destination = destination;
    if (loadType) load.loadType = loadType;
    if (quantity) load.quantity = quantity;
    if (estimatedFare) load.estimatedFare = estimatedFare;
    if (description !== undefined) load.description = description;
    if (estimatedDeliveryDate !== undefined) load.estimatedDeliveryDate = estimatedDeliveryDate;
    
    const updatedLoad = await load.save();
    res.json({ msg: 'Load updated successfully', load: updatedLoad });
  } catch (err) {
    console.error('Edit load error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Export loads to CSV
router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    const loads = await Load.find({ customerId: req.user.id }).sort({ createdAt: -1 });
    
    // Create CSV content
    let csv = 'ID,Source,Destination,Load Type,Quantity,Estimated Fare,Status,Created At,Completed At\n';
    
    loads.forEach(load => {
      csv += `"${load._id}","${load.source}","${load.destination}","${load.loadType}",${load.quantity},${load.estimatedFare},"${load.status}","${new Date(load.createdAt).toLocaleString()}","${load.completedAt ? new Date(load.completedAt).toLocaleString() : 'N/A'}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=loads.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export loads error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get loads with filters and sorting
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      minFare, 
      maxFare, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      status 
    } = req.query;
    
    // Build query
    const query = { customerId: req.user.id };
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Price range filter
    if (minFare || maxFare) {
      query.estimatedFare = {};
      if (minFare) query.estimatedFare.$gte = Number(minFare);
      if (maxFare) query.estimatedFare.$lte = Number(maxFare);
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const loads = await Load.find(query).sort(sort);
    res.json(loads);
  } catch (err) {
    console.error('Search loads error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
