const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  loadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Load',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  // Customer rating for driver
  customerRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    ratedAt: Date
  },
  // Driver rating for customer
  driverRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    ratedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one rating per load
ratingSchema.index({ loadId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
