/**
 * ==============================================================================
 * SPORTZONE - ADMIN DASHBOARD & SECURITY AUTHORIZATION TEST SUITE
 * ==============================================================================
 */

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

const PORT = 51364;

let server;
let adminToken = '';
let customerToken = '';
let testCategoryId = '';
let testBrandId = '';
let testSupplierId = '';
let testProductId = '';
let testPoId = '';
let customerId = '';

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const headers = {
      'Content-Type': 'application/json'
    };

    if (data) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(postData);
    req.end();
  });
}

async function runAdminTests() {
  console.log('====================================================');
  console.log('[TEST] BẮT ĐẦU KIỂM THỬ TOÀN DIỆN ADMIN DASHBOARD & PHÂN QUYỀN');
  console.log('====================================================');

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('[PASS] Kết nối MongoDB Atlas thành công');
    }

    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`[PASS] Test Server Admin đang lắng nghe trên cổng: ${PORT}`);
        resolve();
      });
    });

    // 1. Admin Login
    const adminRes = await request('POST', '/api/auth/login', {
      email: 'admin@sportshoes.com',
      password: 'Admin123456'
    });
    const adminUser = adminRes.data.data?.user || adminRes.data.user;
    const aToken = adminRes.data.data?.token || adminRes.data.token;
    if (adminRes.status === 200 && adminUser && adminUser.role === 'admin') {
      adminToken = aToken;
      console.log('[PASS] 1. Test Admin Login (200 & role=admin): PASS');
    } else {
      throw new Error(`Admin login failed: ${JSON.stringify(adminRes)}`);
    }

    // 2. Customer Login
    const custRes = await request('POST', '/api/auth/login', {
      email: 'customer@sportshoes.com',
      password: 'Customer123456'
    });
    const custUser = custRes.data.data?.user || custRes.data.user;
    const cToken = custRes.data.data?.token || custRes.data.token;
    if (custRes.status === 200 && custUser && custUser.role === 'customer') {
      customerToken = cToken;
      customerId = custUser.id || custUser._id;
      console.log('[PASS] 2. Test Customer Login (200 & role=customer): PASS');
    } else {
      throw new Error(`Customer login failed: ${JSON.stringify(custRes)}`);
    }

    // 3. Security: Customer calls Admin Endpoints -> MUST BE 403 FORBIDDEN
    const forbiddenTests = [
      { name: 'GET /api/dashboard/stats', method: 'GET', path: '/api/dashboard/stats' },
      { name: 'GET /api/admin/orders', method: 'GET', path: '/api/admin/orders' },
      { name: 'GET /api/admin/customers', method: 'GET', path: '/api/admin/customers' },
      { name: 'GET /api/suppliers', method: 'GET', path: '/api/suppliers' },
      { name: 'GET /api/purchase-orders', method: 'GET', path: '/api/purchase-orders' },
      { name: 'POST /api/products', method: 'POST', path: '/api/products', data: { name: 'Hack' } }
    ];

    for (const test of forbiddenTests) {
      const res = await request(test.method, test.path, test.data, customerToken);
      if (res.status === 403) {
        console.log(`[PASS] 3. Security Guard [${test.name}] với Customer Token -> 403 Forbidden: PASS`);
      } else {
        throw new Error(`Security failed for ${test.name}: Expected 403, got ${res.status}`);
      }
    }

    // 4. Admin calls Dashboard Stats -> 200
    const statsRes = await request('GET', '/api/dashboard/stats', null, adminToken);
    if (statsRes.status === 200 && statsRes.data.data.financials && statsRes.data.data.revenueTrends) {
      console.log('[PASS] 4. Admin GET /api/dashboard/stats (KPIs, Charts data): PASS');
    } else {
      throw new Error(`Dashboard stats failed: ${JSON.stringify(statsRes)}`);
    }

    // 5. Admin Category CRUD
    const catRes = await request('POST', '/api/categories', {
      name: `Category Test ${Date.now()}`,
      description: 'Danh mục phục vụ test tự động',
      status: 'active'
    }, adminToken);
    if (catRes.status === 201) {
      testCategoryId = catRes.data.data._id;
      console.log('[PASS] 5. Admin POST /api/categories: PASS');
    } else {
      throw new Error(`Create category failed: ${JSON.stringify(catRes)}`);
    }

    // 6. Admin Brand CRUD
    const brandRes = await request('POST', '/api/brands', {
      name: `Brand Test ${Date.now()}`,
      description: 'Thương hiệu phục vụ test tự động',
      status: 'active'
    }, adminToken);
    if (brandRes.status === 201) {
      testBrandId = brandRes.data.data._id;
      console.log('[PASS] 6. Admin POST /api/brands: PASS');
    } else {
      throw new Error(`Create brand failed: ${JSON.stringify(brandRes)}`);
    }

    // 7. Admin Supplier CRUD
    const supRes = await request('POST', '/api/suppliers', {
      name: `NCC Test ${Date.now()}`,
      contactName: 'Test Contact',
      phone: '0988776655',
      email: `test_ncc_${Date.now()}@domain.com`,
      leadTimeDays: 3,
      status: 'active'
    }, adminToken);
    if (supRes.status === 201) {
      testSupplierId = supRes.data.data._id;
      console.log('[PASS] 7. Admin POST /api/suppliers: PASS');
    } else {
      throw new Error(`Create supplier failed: ${JSON.stringify(supRes)}`);
    }

    // 8. Admin Product Create with Variants
    const skuCode = `SKU-TEST-${Date.now().toString().slice(-4)}`;
    const prodRes = await request('POST', '/api/products', {
      name: `Giày Thể Thao Test Admin ${Date.now().toString().slice(-4)}`,
      brand: testBrandId,
      category: testCategoryId,
      costPrice: 800000,
      salePrice: 1500000,
      description: 'Sản phẩm test cho Admin Dashboard',
      variants: [
        {
          sku: skuCode,
          color: 'Trắng',
          size: 42,
          stockQuantity: 5,
          lowStockThreshold: 2,
          price: 1500000,
          importPrice: 800000
        }
      ]
    }, adminToken);
    if (prodRes.status === 201) {
      testProductId = prodRes.data.data._id;
      console.log('[PASS] 8. Admin POST /api/products (Tạo SP & Variants): PASS');
    } else {
      throw new Error(`Create product failed: ${JSON.stringify(prodRes)}`);
    }

    // 9. Admin Inventory Check
    const invRes = await request('GET', `/api/inventory/${testProductId}`, null, adminToken);
    if (invRes.status === 200 && invRes.data.data.length > 0) {
      console.log('[PASS] 9. Admin GET /api/inventory/:productId: PASS');
    } else {
      throw new Error(`Inventory check failed: ${JSON.stringify(invRes)}`);
    }

    // 10. Admin Purchase Order Creation (JIT replenishment)
    const poRes = await request('POST', '/api/purchase-orders', {
      supplierId: testSupplierId,
      supplier: testSupplierId,
      items: [
        {
          productId: testProductId,
          size: 42,
          color: 'Trắng',
          quantity: 20,
          costPrice: 800000
        }
      ],
      note: 'Nhập bổ sung JIT tự động'
    }, adminToken);
    if (poRes.status === 201) {
      testPoId = poRes.data.data._id;
      console.log('[PASS] 10. Admin POST /api/purchase-orders: PASS');
    } else {
      throw new Error(`Create PO failed: ${JSON.stringify(poRes)}`);
    }

    // 11. Admin PO Received Status -> Automatically increments inventory!
    const poStatusRes = await request('PATCH', `/api/purchase-orders/${testPoId}/status`, {
      status: 'received'
    }, adminToken);
    if (poStatusRes.status === 200) {
      console.log('[PASS] 11. Admin PATCH /api/purchase-orders/:id/status (Chuyển sang received): PASS');
    } else {
      throw new Error(`Update PO status failed: ${JSON.stringify(poStatusRes)}`);
    }

    // 12. Verify Inventory incremented
    const invAfterRes = await request('GET', `/api/inventory/${testProductId}`, null, adminToken);
    const updatedQty = invAfterRes.data.data[0].quantity;
    if (updatedQty === 25) { // Ban đầu 5 + nhập 20 = 25
      console.log(`[PASS] 12. Kiểm tra tồn kho sau khi nhập PO received (5 + 20 = ${updatedQty}): PASS`);
    } else {
      throw new Error(`Stock replenishment check failed. Expected 25, got ${updatedQty}`);
    }

    // 13. Admin Customer Management (No password exposed)
    const custsRes = await request('GET', '/api/admin/customers', null, adminToken);
    if (custsRes.status === 200 && custsRes.data.data.length > 0) {
      const sample = custsRes.data.data[0];
      if (sample.password === undefined) {
        console.log('[PASS] 13. Admin GET /api/admin/customers (Không để lộ password hash): PASS');
      } else {
        throw new Error('Customer password leaked in API!');
      }
    } else {
      throw new Error(`Get customers failed: ${JSON.stringify(custsRes)}`);
    }

    // 14. Admin Promotion CRUD
    const promoCode = `PROMO${Date.now().toString().slice(-4)}`;
    const promoRes = await request('POST', '/api/promotions', {
      code: promoCode,
      name: 'Voucher Khuyến Mãi Test',
      discountType: 'fixed',
      discountValue: 50000,
      minOrderValue: 200000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      usageLimit: 50,
      status: 'active'
    }, adminToken);
    if (promoRes.status === 201) {
      console.log('[PASS] 14. Admin POST /api/promotions (Tạo voucher mới): PASS');
    } else {
      throw new Error(`Create promotion failed: ${JSON.stringify(promoRes)}`);
    }

    // 15. Admin Review Moderation
    const reviewsRes = await request('GET', '/api/admin/reviews', null, adminToken);
    if (reviewsRes.status === 200) {
      console.log('[PASS] 15. Admin GET /api/admin/reviews: PASS');
    } else {
      throw new Error(`Get reviews failed: ${JSON.stringify(reviewsRes)}`);
    }

    // 16. Admin Order Status Update
    const allOrdersRes = await request('GET', '/api/admin/orders', null, adminToken);
    if (allOrdersRes.status === 200 && allOrdersRes.data.data.length > 0) {
      const orderToUpdate = allOrdersRes.data.data[0];
      const updateOrderRes = await request('PATCH', `/api/admin/orders/${orderToUpdate._id}/status`, {
        orderStatus: 'processing',
        fulfillmentStatus: 'in_stock'
      }, adminToken);
      if (updateOrderRes.status === 200) {
        console.log('[PASS] 16. Admin PATCH /api/admin/orders/:id/status: PASS');
      }
    }

    // 17. Static HTML Admin routing check
    const staticRes = await request('GET', '/admin/dashboard.html');
    if (staticRes.status === 200 && staticRes.body.includes('SportZone Admin')) {
      console.log('[PASS] 17. Static Serving /admin/dashboard.html: PASS');
    } else {
      throw new Error(`Admin static serve failed: status ${staticRes.status}`);
    }

    console.log('====================================================');
    console.log('[SUCCESS] TOÀN BỘ 17 BÀI TEST ADMIN & SECURITY ĐỀU PASS 100%!');
    console.log('====================================================');

  } catch (err) {
    console.error('[FAIL] Lỗi Test:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
  }
}

runAdminTests();
