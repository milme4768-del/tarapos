const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: 'Guest',
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    normalizedMobile: {
      type: String,
      required: [true, 'Normalized mobile is required'],
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    totalBills: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastVisitAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
customerSchema.index({ name: 'text', mobile: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
