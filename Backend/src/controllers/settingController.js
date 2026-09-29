const Setting = require('../models/Setting');

/**
 * @route   GET /api/settings
 * @desc    Get general settings
 * @access  Private
 */
const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne({ key: 'general' });
    if (!settings) {
      settings = await Setting.create({ key: 'general' });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/settings
 * @desc    Update restaurant and system settings
 * @access  Private (Admin only)
 */
const updateSettings = async (req, res, next) => {
  try {
    const {
      restaurantName,
      tagline,
      logoUrl,
      address,
      phone,
      email,
      defaultTaxPercentage,
      defaultWhatsAppMessage,
      currency,
    } = req.body;

    let settings = await Setting.findOne({ key: 'general' });
    if (!settings) {
      settings = new Setting({ key: 'general' });
    }

    if (restaurantName) settings.restaurantName = restaurantName.trim();
    if (tagline !== undefined) settings.tagline = tagline.trim();
    if (logoUrl !== undefined) settings.logoUrl = logoUrl.trim();
    if (address !== undefined) settings.address = address.trim();
    if (phone !== undefined) settings.phone = phone.trim();
    if (email !== undefined) settings.email = email.trim();
    if (defaultTaxPercentage !== undefined) settings.defaultTaxPercentage = Number(defaultTaxPercentage);
    if (defaultWhatsAppMessage !== undefined) settings.defaultWhatsAppMessage = defaultWhatsAppMessage;
    if (currency !== undefined) settings.currency = currency;

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Settings saved successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
