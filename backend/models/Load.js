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
  description: {
    type: String,
    default: ''
  },
  estimatedDeliveryDate: {
    type: Date
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
    averageRating: {
      type: Number,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
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
    },
    averageRating: {
      type: Number,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  // Rating flags
  customerRated: {
    type: Boolean,
    default: false
  },
  driverRated: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Load', loadSchema);