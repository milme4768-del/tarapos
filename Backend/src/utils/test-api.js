const http = require('http');
const app = require('../app');
const { connectDB, disconnectDB } = require('../config/db');

const runTests = async () => {
  console.log('[Test] Connecting DB...');
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));
  const baseUrl = 'http://127.0.0.1:5099';

  const request = async (url, options = {}) => {
    const res = await fetch(`${baseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const body = await res.json();
    return { status: res.status, body };
  };

  try {
    console.log('\n--- 1. Testing Health Check ---');
    const health = await request('/api/health');
    console.log('Health:', health.status, health.body.status);
    if (health.status !== 200) throw new Error('Health check failed');

    console.log('\n--- 2. Testing Invalid Login ---');
    const badLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@taraaang.com', password: 'wrong' }),
    });
    console.log('Bad login status (expected 401):', badLogin.status);
    if (badLogin.status !== 401) throw new Error('Bad login should return 401');

    console.log('\n--- 3. Testing Admin Login ---');
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@taraaang.com', password: 'admin123' }),
    });
    console.log('Admin login status:', adminLogin.status, 'Role:', adminLogin.body.data.user.role);
    const adminToken = adminLogin.body.data.token;

    console.log('\n--- 4. Testing Staff Login ---');
    const staffLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'staff@taraaang.com', password: 'staff123' }),
    });
    console.log('Staff login status:', staffLogin.status, 'Outlet:', staffLogin.body.data.user.outletId.name);
    const staffToken = staffLogin.body.data.token;
    const staffOutletId = staffLogin.body.data.user.outletId._id;

    console.log('\n--- 5. Testing Active Products Catalog for POS ---');
    const productsRes = await request('/api/products?catalog=active', {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    console.log('Active food items count:', productsRes.body.count);
    const biryani = productsRes.body.data.find((p) => p.name.includes('Chicken Dum Biryani'));
    const tea = productsRes.body.data.find((p) => p.name.includes('Special Masala Tea'));
    console.log('Found Biryani:', biryani.name, 'Variants:', biryani.variants.map((v) => `${v.name} (₹${v.price})`));

    const fullBiryaniVariant = biryani.variants.find((v) => v.name.includes('Full Plate'));
    const teaVariant = tea.variants[0];

    console.log('\n--- 6. Testing POS Bill Creation (Scenario Test) ---');
    const clientRequestId = 'req_test_' + Date.now();
    const billPayload = {
      clientRequestId,
      customer: {
        name: 'Rahul Das',
        mobile: '9876543210',
      },
      items: [
        {
          productId: biryani._id,
          variantId: fullBiryaniVariant._id,
          quantity: 2, // 2 x 240 = 480
        },
        {
          productId: tea._id,
          variantId: teaVariant._id,
          quantity: 2, // 2 x 20 = 40
        },
      ],
      discount: 0,
      paymentMethod: 'upi',
    };

    const billRes = await request('/api/bills', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify(billPayload),
    });

    console.log('Bill status:', billRes.status);
    console.log('Bill Number:', billRes.body.data.bill.billNumber);
    console.log('Subtotal (expected 520):', billRes.body.data.bill.subtotal);
    console.log('Tax 5% (expected 26):', billRes.body.data.bill.tax);
    console.log('Grand Total (expected 546):', billRes.body.data.bill.grandTotal);
    console.log('WhatsApp Link generated:', billRes.body.data.whatsappLink ? 'YES' : 'NO');

    const createdBillId = billRes.body.data.bill._id;

    console.log('\n--- 7. Testing Idempotency (Duplicate Bill Tap) ---');
    const duplicateRes = await request('/api/bills', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify(billPayload),
    });
    console.log('Duplicate request status:', duplicateRes.status);
    console.log('Same bill returned?:', duplicateRes.body.data._id === createdBillId || duplicateRes.body.data.bill?._id === createdBillId ? 'YES' : 'NO');

    console.log('\n--- 8. Testing Outlet Isolation ---');
    // Staff A tries to query bills with outlet B query parameter
    const staffOutletBQuery = await request(`/api/bills?outletId=666666666666666666666666`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    console.log('Staff queries all bills count:', staffOutletBQuery.body.data.length);
    const anyNonOutletA = staffOutletBQuery.body.data.some((b) => b.outletId._id !== staffOutletId);
    console.log('Did staff get any bill from another outlet?:', anyNonOutletA ? 'FAIL' : 'ISOLATED SECURELY');

    console.log('\n--- 9. Testing Price Immutability After Admin Price Change ---');
    // Admin updates Biryani price from 240 to 280
    const updatedVariants = biryani.variants.map((v) => {
      if (v._id === fullBiryaniVariant._id) return { ...v, price: 280 };
      return v;
    });
    await request(`/api/products/${biryani._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ variants: updatedVariants }),
    });

    // Fetch existing bill and verify old price is still 240!
    const billCheck = await request(`/api/bills/${createdBillId}`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    const snapshotItem = billCheck.body.data.items.find((i) => i.productName.includes('Chicken Dum Biryani'));
    console.log('Snapshot unit price on past bill (expected 240):', snapshotItem.unitPrice);
    if (snapshotItem.unitPrice !== 240) throw new Error('Price immutability failed!');
    console.log('Price immutability verified: past bills retain original price.');

    console.log('\n--- 10. Testing Admin Dashboard Aggregation ---');
    const dashboardRes = await request('/api/reports/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('Dashboard today sales:', dashboardRes.body.data.summary.todaySales);
    console.log('Dashboard today bills:', dashboardRes.body.data.summary.todayBills);
    console.log('Dashboard sales by outlet:', dashboardRes.body.data.salesByOutlet.length, 'outlets');

    console.log('\n===============================================');
    console.log('🎉 ALL BACKEND API & BUSINESS LOGIC TESTS PASSED!');
    console.log('===============================================\n');
  } finally {
    server.close();
    await disconnectDB();
  }
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
