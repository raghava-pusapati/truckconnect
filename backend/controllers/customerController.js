const Load = require('../models/Load');

exports.postLoad = async (req, res) => {
  try {
    const { source, destination, loadType, quantity, estimatedFare } = req.body;
    
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
    
    await newLoad.save();
    res.json(newLoad);
  } catch (err) {
    console.error('Error posting load:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getApplicants = async (req, res) => {
  try {
    const load = await Load.findById(req.params.loadId);
    
    // Check if the load exists and belongs to the current customer
    if (!load || load.customerId.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'Load not found or unauthorized' });
    }
    
    res.json(load.applicants || []);
  } catch (err) {
    console.error('Error getting applicants:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.assignDriver = async (req, res) => {
  try {
    const { driverId } = req.body;
    
    if (!driverId) {
      return res.status(400).json({ msg: 'Driver ID is required' });
    }
    
    const load = await Load.findById(req.params.loadId);
    
    // Check if the load exists and belongs to the current customer
    if (!load || load.customerId.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'Load not found or unauthorized' });
    }
    
    // Find the driver in the applicants
    const applicant = load.applicants.find(app => app.driverId.toString() === driverId);
    
    if (!applicant) {
      return res.status(400).json({ msg: 'Driver has not applied for this load' });
    }
    
    // Set the assigned driver
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
    
    res.json(load);
  } catch (err) {
    console.error('Error assigning driver:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};