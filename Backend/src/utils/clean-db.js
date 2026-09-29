require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Outlet = require('../models/Outlet');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Bill = require('../models/Bill');
const Counter = require('../models/Counter');
const AuditLog = require('../models/AuditLog');
const Setting = require('../models/Setting');
const { ROLES } = require('../constants/roles');

const cleanDatabase = async () => {
  try {
    console.log('[CleanDB] Connecting to database...');
    await connectDB();

    // 1. Verify Super Admin exists
    const admin = await User.findOne({ role: ROLES.ADMIN });
    if (!admin) {
      console.error('[CleanDB] Error: No admin user found in database! Aborting to prevent lockout.');
      process.exit(1);
    }
    console.log(`[CleanDB] Preserving Admin account: ${admin.email} (${admin.name})`);

    // 2. Clear transactional and catalog collections
    console.log('[CleanDB] Deleting all bills...');
    await Bill.deleteMany({});

    console.log('[CleanDB] Deleting all products...');
    await Product.deleteMany({});

    console.log('[CleanDB] Deleting all categories...');
    await Category.deleteMany({});

    console.log('[CleanDB] Deleting all customers...');
    await Customer.deleteMany({});

    console.log('[CleanDB] Deleting all counters (resetting bill numbering)...');
    await Counter.deleteMany({});

    console.log('[CleanDB] Deleting all audit logs...');
    await AuditLog.deleteMany({});

    // 3. Delete all demo users except Admin
    console.log('[CleanDB] Deleting all demo staff/managers (preserving Admin)...');
    const deleteUsersResult = await User.deleteMany({ role: { $ne: ROLES.ADMIN } });
    console.log(`[CleanDB] Removed ${deleteUsersResult.deletedCount} non-admin demo users.`);

    // 4. Setup 1 Clean Primary Outlet
    console.log('[CleanDB] Cleaning outlets and configuring primary branch...');
    await Outlet.deleteMany({});
    const primaryOutlet = await Outlet.create({
      name: process.env.RESTAURANT_NAME || 'Taraaang Organic Food',
      code: 'OUT1',
      address: '',
      phone: '',
      email: admin.email,
      taxPercentage: 0,
      currency: 'Rs.',
      isActive: true,
    });
    console.log(`[CleanDB] Created primary outlet: "${primaryOutlet.name}" (Code: ${primaryOutlet.code})`);

    // 5. Link Admin to Primary Outlet
    admin.outletId = primaryOutlet._id;
    await admin.save();
    console.log('[CleanDB] Linked Admin to primary outlet.');

    // 6. Ensure Clean Settings
    await Setting.findOneAndUpdate(
      { key: 'general' },
      {
        restaurantName: process.env.RESTAURANT_NAME || 'Taraaang Organic Food PVT LTD',
        currency: 'Rs.',
        defaultTaxPercentage: 0,
      },
      { upsert: true, new: true }
    );

    console.log('\n==================================================');
    console.log('✅ DATABASE CLEANED SUCCESSFULLY!');
    console.log('==================================================');
    console.log('Preserved Admin Account:');
    console.log(`- Email (User ID): ${admin.email}`);
    console.log('- Password:       (Unchanged, existing password preserved)');
    console.log(`- Role:           ${admin.role}`);
    console.log(`- Active Outlet:  ${primaryOutlet.name} (${primaryOutlet.code})`);
    console.log('--------------------------------------------------');
    console.log('Summary of remaining database records:');
    console.log(`- Users:      ${await User.countDocuments()} (Admin only)`);
    console.log(`- Outlets:    ${await Outlet.countDocuments()} (1 Primary Outlet)`);
    console.log(`- Categories: ${await Category.countDocuments()}`);
    console.log(`- Products:   ${await Product.countDocuments()}`);
    console.log(`- Bills:      ${await Bill.countDocuments()}`);
    console.log(`- Customers:  ${await Customer.countDocuments()}`);
    console.log('==================================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[CleanDB] Fatal error cleaning database:', error);
    process.exit(1);
  }
};

cleanDatabase();
