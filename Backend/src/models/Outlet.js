const mongoose = require('mongoose');

const outletSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Outlet name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Outlet code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 10,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    taxPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    currency: {
      type: String,
      default: 'Rs.',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Outlet', outletSchema);
