const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const { ROLES } = require('../constants/roles');

/**
 * @route   GET /api/products
 * @desc    Get products (active catalog for POS billing, or paginated/filtered for Admin)
 * @access  Private
 */
const getProducts = async (req, res, next) => {
  try {
    const { catalog, categoryId, search, isActive, page = 1, limit = 50 } = req.query;

    // Fast path for POS billing screen: get all active products with active variants
    if (catalog === 'active') {
      const activeProducts = await Product.find({ isActive: true })
        .populate('categoryId', 'name icon sortOrder')
        .sort({ isPopular: -1, name: 1 })
        .lean();

      // Filter only active variants and transform
      const cleaned = activeProducts.map((prod) => ({
        ...prod,
        variants: (prod.variants || []).filter((v) => v.isActive !== false),
      }));

      return res.status(200).json({
        success: true,
        count: cleaned.length,
        data: cleaned,
      });
    }

    // Admin / Management query path
    const query = {};

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { 'variants.name': searchRegex },
        { 'variants.sku': searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name icon')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/:id
 * @desc    Get product details by ID
 * @access  Private
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId', 'name icon');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        errorCode: 'PRODUCT_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/products
 * @desc    Create new product with variants
 * @access  Private (Admin only)
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, categoryId, description, image, sku, isPopular, variants } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Product name and category are required.',
        errorCode: 'MISSING_FIELDS',
      });
    }

    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one variant (e.g. Full Plate, 1 Kg, etc.) is required.',
        errorCode: 'MISSING_VARIANTS',
      });
    }

    // Validate variants
    const cleanedVariants = variants.map((v) => {
      if (!v.name || v.price === undefined) {
        throw new Error('All variants must have a name and price.');
      }
      return {
        name: v.name.trim(),
        quantity: Number(v.quantity) || 1,
        unit: v.unit ? v.unit.toLowerCase().trim() : 'plate',
        price: Number(v.price),
        sku: v.sku ? v.sku.trim() : '',
        isActive: v.isActive !== false,
      };
    });

    const product = await Product.create({
      name: name.trim(),
      categoryId,
      description: description ? description.trim() : '',
      image: image || '',
      sku: sku ? sku.trim() : '',
      isPopular: Boolean(isPopular),
      variants: cleanedVariants,
    });

    await product.populate('categoryId', 'name icon');

    // Audit log
    await AuditLog.create({
      action: 'PRODUCT_CREATED',
      performedBy: req.user._id,
      outletId: req.user.outletId,
      details: { productId: product._id, name: product.name },
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/products/:id
 * @desc    Update product and variants
 * @access  Private (Admin only)
 */
const updateProduct = async (req, res, next) => {
  try {
    const { name, categoryId, description, image, sku, isPopular, isActive, variants } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        errorCode: 'PRODUCT_NOT_FOUND',
      });
    }

    const oldSnapshot = {
      name: product.name,
      variants: product.variants.map((v) => ({ name: v.name, price: v.price })),
    };

    if (name) product.name = name.trim();
    if (categoryId) product.categoryId = categoryId;
    if (description !== undefined) product.description = description.trim();
    if (image !== undefined) product.image = image;
    if (sku !== undefined) product.sku = sku.trim();
    if (isPopular !== undefined) product.isPopular = Boolean(isPopular);
    if (isActive !== undefined) product.isActive = Boolean(isActive);

    if (Array.isArray(variants)) {
      if (variants.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Product must have at least one variant.',
          errorCode: 'INVALID_VARIANTS',
        });
      }

      product.variants = variants.map((v) => ({
        _id: v._id || undefined,
        name: v.name.trim(),
        quantity: Number(v.quantity) || 1,
        unit: v.unit ? v.unit.toLowerCase().trim() : 'plate',
        price: Number(v.price),
        sku: v.sku ? v.sku.trim() : '',
        isActive: v.isActive !== false,
      }));
    }

    await product.save();
    await product.populate('categoryId', 'name icon');

    // Audit log price/variant changes
    await AuditLog.create({
      action: 'PRODUCT_UPDATED',
      performedBy: req.user._id,
      outletId: req.user.outletId,
      details: {
        productId: product._id,
        name: product.name,
        old: oldSnapshot,
        newVariants: product.variants.map((v) => ({ name: v.name, price: v.price })),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/products/:id
 * @desc    Toggle product status or delete
 * @access  Private (Admin only)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        errorCode: 'PRODUCT_NOT_FOUND',
      });
    }

    // Soft toggle isActive
    product.isActive = !product.isActive;
    await product.save();

    await AuditLog.create({
      action: product.isActive ? 'PRODUCT_ACTIVATED' : 'PRODUCT_DEACTIVATED',
      performedBy: req.user._id,
      outletId: req.user.outletId,
      details: { productId: product._id, name: product.name },
    });

    res.status(200).json({
      success: true,
      message: `Product is now ${product.isActive ? 'active' : 'inactive'}`,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
