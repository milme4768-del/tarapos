require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Outlet = require('../models/Outlet');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Setting = require('../models/Setting');
const { ROLES } = require('../constants/roles');
const { normalizeMobile } = require('./phone');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing demo data...');
    await Promise.all([
      User.deleteMany({}),
      Outlet.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Customer.deleteMany({}),
      Setting.deleteMany({}),
    ]);

    // 1. Seed Outlets
    console.log('[Seed] Creating Outlets...');
    const outletA = await Outlet.create({
      name: 'Taraaang Central (MG Road)',
      code: 'OUT1',
      address: '101 MG Road, Central District',
      phone: '+91 98765 00001',
      email: 'central@taraaang.com',
      taxPercentage: 0,
      currency: 'Rs.',
      isActive: true,
    });

    const outletB = await Outlet.create({
      name: 'Taraaang Express (Airport)',
      code: 'OUT2',
      address: '45 Terminal Boulevard, Airport Plaza',
      phone: '+91 98765 00002',
      email: 'express@taraaang.com',
      taxPercentage: 0,
      currency: 'Rs.',
      isActive: true,
    });

    // 2. Seed Users
    console.log('[Seed] Creating Users...');
    await User.create([
      {
        name: 'Super Admin',
        email: 'admin@taraaang.com',
        password: 'admin123',
        role: ROLES.ADMIN,
        outletId: null,
        phone: '9876543210',
        isActive: true,
      },
      {
        name: 'Rajesh Sharma (Manager)',
        email: 'manager@taraaang.com',
        password: 'manager123',
        role: ROLES.MANAGER,
        outletId: outletA._id,
        phone: '9876543211',
        isActive: true,
      },
      {
        name: 'Sunil Kumar (Staff Outlet A)',
        email: 'staff@taraaang.com',
        password: 'staff123',
        role: ROLES.STAFF,
        outletId: outletA._id,
        phone: '9876543212',
        isActive: true,
      },
      {
        name: 'Pooja Verma (Staff Outlet B)',
        email: 'staffb@taraaang.com',
        password: 'staff123',
        role: ROLES.STAFF,
        outletId: outletB._id,
        phone: '9876543213',
        isActive: true,
      },
    ]);

    // 3. Seed Categories
    console.log('[Seed] Creating Categories...');
    const catBiryani = await Category.create({ name: 'Biryani', icon: 'Flame', sortOrder: 1 });
    const catChicken = await Category.create({ name: 'Chicken & Starters', icon: 'Drumstick', sortOrder: 2 });
    const catRice = await Category.create({ name: 'Rice & Breads', icon: 'Wheat', sortOrder: 3 });
    const catDrinks = await Category.create({ name: 'Beverages', icon: 'CupSoda', sortOrder: 4 });
    const catTea = await Category.create({ name: 'Tea & Coffee', icon: 'Coffee', sortOrder: 5 });
    const catDessert = await Category.create({ name: 'Desserts', icon: 'IceCream', sortOrder: 6 });

    // 4. Seed Products with Variants and Units
    console.log('[Seed] Creating Products with Flexible Variants...');
    await Product.create([
      {
        name: 'Chicken Dum Biryani',
        categoryId: catBiryani._id,
        description: 'Slow-cooked fragrant basmati rice with succulent chicken pieces and spices',
        isPopular: true,
        variants: [
          { name: 'Half Plate', quantity: 0.5, unit: 'plate', price: 140, sku: 'CHK-BIR-HALF' },
          { name: 'Full Plate', quantity: 1, unit: 'plate', price: 240, sku: 'CHK-BIR-FULL' },
        ],
      },
      {
        name: 'Mutton Dum Biryani',
        categoryId: catBiryani._id,
        description: 'Tender mutton cooked in rich spices layered with saffron basmati rice',
        isPopular: true,
        variants: [
          { name: 'Half Plate', quantity: 0.5, unit: 'plate', price: 180, sku: 'MUT-BIR-HALF' },
          { name: 'Full Plate', quantity: 1, unit: 'plate', price: 320, sku: 'MUT-BIR-FULL' },
        ],
      },
      {
        name: 'Chicken Kabab',
        categoryId: catChicken._id,
        description: 'Crispy spicy fried chicken kabab with onion rings and lemon',
        isPopular: true,
        variants: [
          { name: 'Quarter (4 Pcs)', quantity: 4, unit: 'piece', price: 120, sku: 'CHK-KAB-QTR' },
          { name: 'Half (8 Pcs)', quantity: 8, unit: 'piece', price: 220, sku: 'CHK-KAB-HLF' },
          { name: 'Full (16 Pcs)', quantity: 16, unit: 'piece', price: 400, sku: 'CHK-KAB-FUL' },
        ],
      },
      {
        name: 'Jeera Rice',
        categoryId: catRice._id,
        description: 'Aromatic basmati rice tempered with cumin seeds and pure desi ghee',
        isPopular: false,
        variants: [
          { name: '500 Gram', quantity: 500, unit: 'gram', price: 90, sku: 'JRA-RIC-500G' },
          { name: '1 Kg', quantity: 1, unit: 'kg', price: 170, sku: 'JRA-RIC-1KG' },
        ],
      },
      {
        name: 'Special Masala Tea',
        categoryId: catTea._id,
        description: 'Hot brewed Assam tea infused with ginger, cardamom, and clove',
        isPopular: true,
        variants: [
          { name: '100 ml Regular', quantity: 100, unit: 'ml', price: 20, sku: 'TEA-100ML' },
        ],
      },
      {
        name: 'Filter Coffee',
        categoryId: catTea._id,
        description: 'Traditional South Indian frothy chicory filter coffee',
        isPopular: false,
        variants: [
          { name: '150 ml Cup', quantity: 150, unit: 'ml', price: 25, sku: 'COF-150ML' },
        ],
      },
      {
        name: 'Fresh Lime Soda',
        categoryId: catDrinks._id,
        description: 'Chilled carbonated beverage with freshly squeezed lemon juice (Sweet/Salted)',
        isPopular: true,
        variants: [
          { name: '250 ml Glass', quantity: 250, unit: 'ml', price: 40, sku: 'LIME-250ML' },
        ],
      },
      {
        name: 'Gulab Jamun',
        categoryId: catDessert._id,
        description: 'Soft melt-in-the-mouth khoya balls soaked in warm rose cardamom syrup',
        isPopular: true,
        variants: [
          { name: '2 Pieces', quantity: 2, unit: 'piece', price: 50, sku: 'GJ-2PC' },
          { name: '4 Pieces', quantity: 4, unit: 'piece', price: 90, sku: 'GJ-4PC' },
        ],
      },
    ]);

    // 5. Seed Customer
    console.log('[Seed] Creating Sample Customer...');
    const sampleMobile = '9876543210';
    await Customer.create({
      name: 'Rahul Das',
      mobile: sampleMobile,
      normalizedMobile: normalizeMobile(sampleMobile),
      email: 'rahul.das@example.com',
      totalBills: 2,
      totalSpent: 680,
      lastVisitAt: new Date(),
    });

    // 6. Seed Settings
    console.log('[Seed] Initializing Settings...');
    await Setting.create({
      key: 'general',
      restaurantName: 'Taraaang Organic Food PVT LTD',
      tagline: 'Delicious Food, Served Fast',
      address: '101 MG Road, Central District, Bangalore',
      phone: '+91 98765 00000',
      email: 'info@taraaang.com',
      defaultTaxPercentage: 0,
      currency: 'Rs.',
      defaultWhatsAppMessage:
        'Hello {{customerName}},\n\nThank you for dining at {{restaurantName}} ({{outletName}})!\n\nYour bill: *{{billNumber}}*\nTotal: *{{grandTotal}}*\nDate: {{date}}\n\nWe look forward to serving you again soon! ✨',
    });

    console.log('[Seed] Seeding completed successfully!');
    console.log('--------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('ADMIN:   admin@taraaang.com   / admin123');
    console.log('MANAGER: manager@taraaang.com / manager123 (Outlet A)');
    console.log('STAFF:   staff@taraaang.com   / staff123   (Outlet A)');
    console.log('STAFF B: staffb@taraaang.com  / staff123   (Outlet B)');
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

seedData();
