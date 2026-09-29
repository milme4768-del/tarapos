const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'general',
      unique: true,
    },
    restaurantName: {
      type: String,
      default: 'Taraaang Organic Food PVT LTD',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Delicious Food, Served Fresh',
      trim: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '123 Gourmet Avenue, Food City',
      trim: true,
    },
    phone: {
      type: String,
      default: '+91 98765 43210',
      trim: true,
    },
    email: {
      type: String,
      default: 'contact@taraaang.com',
      trim: true,
    },
    defaultTaxPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    defaultWhatsAppMessage: {
      type: String,
      default:
        'Hello {{customerName}},\n\nThank you for visiting {{restaurantName}} ({{outletName}})!\n\nYour bill: *{{billNumber}}*\nTotal Amount: *{{grandTotal}}*\nDate: {{date}}\n\nThank you for your visit!',
    },
    currency: {
      type: String,
      default: 'Rs.',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', settingSchema);
