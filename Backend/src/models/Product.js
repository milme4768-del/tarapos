const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Variant name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Variant quantity/size is required'],
      min: 0,
      default: 1,
    },
    unit: {
      type: String,
      required: [true, 'Variant unit is required'],
      trim: true,
      lowercase: true,
      default: 'plate',
    },
    price: {
      type: Number,
      required: [true, 'Variant price is required'],
      min: 0,
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    variants: {
      type: [variantSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Product must have at least one variant',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast active products catalog fetching
productSchema.index({ isActive: 1, categoryId: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
