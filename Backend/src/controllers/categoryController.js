const Category = require('../models/Category');
const Product = require('../models/Product');

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Private
 */
const getCategories = async (req, res, next) => {
  try {
    const query = req.query.all === 'true' ? {} : { isActive: true };
    const categories = await Category.find(query).sort({ sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private (Admin only)
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, icon, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
        errorCode: 'MISSING_NAME',
      });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A category with this name already exists.',
        errorCode: 'DUPLICATE_CATEGORY',
      });
    }

    const category = await Category.create({
      name: name.trim(),
      icon: icon || 'Utensils',
      sortOrder: Number(sortOrder) || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private (Admin only)
 */
const updateCategory = async (req, res, next) => {
  try {
    const { name, icon, sortOrder, isActive } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        errorCode: 'CATEGORY_NOT_FOUND',
      });
    }

    if (name && name.trim() !== category.name) {
      const existing = await Category.findOne({ name: name.trim() });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'A category with this name already exists.',
          errorCode: 'DUPLICATE_CATEGORY',
        });
      }
      category.name = name.trim();
    }

    if (icon !== undefined) category.icon = icon.trim();
    if (sortOrder !== undefined) category.sortOrder = Number(sortOrder);
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category (if no products are attached)
 * @access  Private (Admin only)
 */
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        errorCode: 'CATEGORY_NOT_FOUND',
      });
    }

    // Check if products exist in this category
    const productCount = await Product.countDocuments({ categoryId: category._id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: ${productCount} food item(s) are assigned to it. Deactivate the category instead.`,
        errorCode: 'CATEGORY_HAS_PRODUCTS',
      });
    }

    await Category.findByIdAndDelete(category._id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
