const Load = require('../models/Load');
const Driver = require('../models/Driver');

exports.getAvailableLoads = async (req, res) => {
  try {
    console.log('Getting available loads for drivers');
    
    // First, let's check the count of all loads
    const totalLoads = await Load.countDocuments();
    console.log(`Total loads in database: ${totalLoads}`);
    
    // Check pending loads
    const pendingLoads = await Load.countDocuments({ status: 'pending' });
    console.log(`Pending loads: ${pendingLoads}`);
    
    // Check specific condition variants
    const noAssignedDriver = await Load.countDocuments({ 
      assignedDriver: { $exists: false } 
    });
    console.log(`Loads with no assignedDriver field: ${noAssignedDriver}`);
    
    const emptyAssignedDriver = await Load.countDocuments({ 
      'assignedDriver.driverId': { $exists: false } 
    });
    console.log(`Loads with empty assignedDriver.driverId: ${emptyAssignedDriver}`);
    
    const nullAssignedDriver = await Load.countDocuments({ 
      assignedDriver: null 
    });
    console.log(`Loads with null assignedDriver: ${nullAssignedDriver}`);
    
    // Find loads that are pending and don't have an assigned driver
    // The query needs to handle both cases:
    // 1. assignedDriver field doesn't exist
    // 2. assignedDriver exists but doesn't have driverId (empty object)
    const loads = await Load.find({ 
      status: 'pending',
      $or: [
        { assignedDriver: { $exists: false } },
        { 'assignedDriver.driverId': { $exists: false } }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${loads.length} available loads`);
    // Log each load for debugging
    loads.forEach((load, index) => {
      console.log(`Load ${index + 1}:`, {
        id: load._id,
        source: load.source,
        destination: load.destination,
        status: load.status,
        hasAssignedDriver: !!load.assignedDriver,
        assignedDriverId: load.assignedDriver?.driverId
      });
    });
    
    res.json(loads);
  } catch (err) {
    console.error('Error getting available loads:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.applyToLoad = async (req, res) => {
  try {
    // Get the driver ID from the authenticated user
    const driverId = req.user.id;
    
    // Find the load
    const load = await Load.findById(req.params.loadId);
    
    if (!load) {
      return res.status(404).json({ msg: 'Load not found' });
    }
    
    // Check if load is still open for applications
    if (load.status !== 'pending') {
      return res.status(400).json({ msg: 'This load is not available for applications' });
    }
    
    // Check if driver already applied
    const alreadyApplied = load.applicants && load.applicants.some(
      applicant => applicant.driverId.toString() === driverId
    );
    
    if (alreadyApplied) {
      return res.status(400).json({ msg: 'You have already applied for this load' });
    }
    
    // Get driver details
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ msg: 'Driver profile not found' });
    }
    
    // Initialize applicants array if it doesn't exist
    if (!load.applicants) {
      load.applicants = [];
    }
    
    // Add driver to applicants with documents
    load.applicants.push({
      driverId: driverId,
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
    res.json({ msg: 'Applied successfully', load });
  } catch (err) {
    console.error('Error applying to load:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};