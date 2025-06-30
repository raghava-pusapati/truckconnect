const mongoose = require('mongoose');

const loadSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  source: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  loadType: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  estimatedFare: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  applicants: [{
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true
    },
    name: String,
    mobile: String,
    lorryType: String,
    maxCapacity: Number,
    appliedAt: {
      type: Date,
      default: Date.now
    },
    documents: {
      license: String,
      rc: String,
      fitness: String,
      insurance: String,
      medical: String,
      allIndiaPermit: String
    }
  }],
  assignedDriver: {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    name: String,
    mobile: String,
    lorryType: String,
    maxCapacity: Number,
    assignedAt: {
      type: Date,
      default: null
    }
  }
});

module.exports = mongoose.model('Load', loadSchema);