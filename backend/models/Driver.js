const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: { 
    type: String, 
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  lorryType: {
    type: String,
    required: true
  },
  maxCapacity: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  documents: {
    license: { 
      url: { type: String },
      expiryDate: { type: Date }
    },
    rc: { 
      url: { type: String },
      expiryDate: { type: Date }
    },
    fitness: { 
      url: { type: String },
      expiryDate: { type: Date }
    },
    insurance: { 
      url: { type: String },
      expiryDate: { type: Date }
    },
    allIndiaPermit: { 
      url: { type: String },
      expiryDate: { type: Date }
    },
    medical: { 
      url: { type: String },
      expiryDate: { type: Date }
    }
  },
  role: {
    type: String,
    default: 'driver'
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  profilePicture: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
driverSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method for login
driverSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Driver', driverSchema);