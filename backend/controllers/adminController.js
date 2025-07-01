const Driver = require('../models/Driver');

exports.getPendingDrivers = async (req, res) => {
  try {
    const pending = await Driver.find({ status: 'pending' });
    res.json(pending);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.approveDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.driverId);
    if (!driver) return res.status(404).json({ msg: 'Driver not found' });
    
    driver.status = 'accepted';
    await driver.save();
    
    res.json(driver);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.rejectDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.driverId);
    if (!driver) return res.status(404).json({ msg: 'Driver not found' });
    
    driver.status = 'rejected';
    await driver.save();
    
    res.json({ msg: 'Driver rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};