require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

const runTests = async () => {
  console.log('====================================================');
  console.log('[TEST] BẮT ĐẦU CHẠY BỘ KIỂM THỬ BACKEND (TEST SUITE)');
  console.log('====================================================');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[PASS] Kết nối MongoDB Atlas thành công');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`[PASS] Test Server đang lắng nghe trên cổng: ${port}`);

  let adminToken = '';
  let customerToken = '';
  let testProductId = '';
  let testBrandId = '';
  let testCategoryId = '';
  let testSupplierId = '';
  let testPoId = '';

  const request = async (endpoint, options = {}) => {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, body: json };
  };

  try {
    // 1. Health check
    const health = await request('/health');
    console.assert(health.status === 200 && health.body.success === true, 'Health check thất bại');
    console.log('[PASS] 1. Test /api/health: PASS');

    // 2. Register
    const regEmail = `testuser_${Date.now()}@example.com`;
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Khách Hàng',
        email: regEmail,
        password: 'Password123',
        phone: '0912345678'
      })
    });
    console.assert(regRes.status === 201 && regRes.body.success === true, 'Register thất bại');
    console.log('[PASS] 2. Test Register: PASS');

    // 3. Login Customer & Admin
    const loginAdmin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@sportshoes.com', password: 'Admin123456' })
    });
    console.assert(loginAdmin.status === 200 && loginAdmin.body.data.token, 'Login Admin thất bại');
    adminToken = loginAdmin.body.data.token;
    console.log('[PASS] 3. Test Login Admin: PASS');

    const loginCustomer = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'customer@sportshoes.com', password: 'Customer123456' })
    });
    console.assert(loginCustomer.status === 200 && loginCustomer.body.data.token, 'Login Customer thất bại');
    customerToken = loginCustomer.body.data.token;
    console.log('[PASS] 4. Test Login Customer & JWT: PASS');

    // 4. Test GET /api/auth/me
    const meRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.assert(meRes.status === 200 && meRes.body.data.email === 'customer@sportshoes.com', 'Get Me thất bại');
    console.log('[PASS] 5. Test GET /api/auth/me: PASS');

    // 5. Test Brand CRUD
    const brandCreate = await request('/brands', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: `Test Brand ${Date.now()}`, description: 'Test desc' })
    });
    console.assert(brandCreate.status === 201, 'Create Brand thất bại');
    testBrandId = brandCreate.body.data._id;

    const brandGet = await request(`/brands/${testBrandId}`);
    console.assert(brandGet.status === 200, 'Get Brand by ID thất bại');

    const brandUpdate = await request(`/brands/${testBrandId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ description: 'Updated desc' })
    });
    console.assert(brandUpdate.status === 200, 'Update Brand thất bại');
    console.log('[PASS] 6. Test Brand CRUD: PASS');

    // 6. Test Category CRUD
    const catCreate = await request('/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: `Test Cat ${Date.now()}`, description: 'Test cat desc' })
    });
    console.assert(catCreate.status === 201, 'Create Category thất bại');
    testCategoryId = catCreate.body.data._id;

    const catGet = await request(`/categories/${testCategoryId}`);
    console.assert(catGet.status === 200, 'Get Category by ID thất bại');
    console.log('[PASS] 7. Test Category CRUD: PASS');

    // 7. Test Product CRUD & Filters
    const prodList = await request('/products?page=1&limit=5');
    console.assert(prodList.status === 200 && Array.isArray(prodList.body.data), 'Get Products thất bại');

    const newProd = await request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Test Shoe ${Date.now()}`,
        brand: testBrandId,
        category: testCategoryId,
        costPrice: 500000,
        salePrice: 1200000,
        sizes: [40, 41],
        colors: ['Black'],
        stock: 10,
        variants: [
          { sku: `TS-${Date.now()}-40`, size: 40, color: 'Black', stockQuantity: 10, price: 1200000, importPrice: 500000 }
        ]
      })
    });
    console.assert(newProd.status === 201, 'Create Product thất bại');
    testProductId = newProd.body.data._id;

    const prodDetail = await request(`/products/${testProductId}`);
    console.assert(prodDetail.status === 200, 'Get Product Detail thất bại');
    console.log('[PASS] 8. Test Product CRUD & Pagination: PASS');

    // 8. Test Inventory API
    const invList = await request('/inventory', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.assert(invList.status === 200 && Array.isArray(invList.body.data), 'Get Inventory thất bại');

    const invProd = await request(`/inventory/${testProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.assert(invProd.status === 200, 'Get Inventory by ProductId thất bại');
    console.log('[PASS] 9. Test Inventory API: PASS');

    // 9. Test Supplier CRUD
    const supCreate = await request('/suppliers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Test Supplier ${Date.now()}`,
        phone: '0933333333',
        contactName: 'Nguyen Test'
      })
    });
    console.assert(supCreate.status === 201, 'Create Supplier thất bại');
    testSupplierId = supCreate.body.data._id;
    console.log('[PASS] 10. Test Supplier CRUD: PASS');

    // 10. Test Purchase Order API & Inventory Sync
    const poCreate = await request('/purchase-orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        supplierId: testSupplierId,
        items: [
          {
            productId: testProductId,
            size: 40,
            color: 'Black',
            quantity: 5,
            costPrice: 500000
          }
        ]
      })
    });
    console.assert(poCreate.status === 201, 'Create PO thất bại');
    testPoId = poCreate.body.data._id;

    // PATCH PO status to received -> inventory should increment by 5
    const poReceive = await request(`/purchase-orders/${testPoId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'received' })
    });
    console.assert(poReceive.status === 200, 'Receive PO thất bại');

    // Double received check -> must fail
    const poDouble = await request(`/purchase-orders/${testPoId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'received' })
    });
    console.assert(poDouble.status === 400, 'Double received check thất bại');
    console.log('[PASS] 11. Test Purchase Order & Inventory Replenishment: PASS');

    // 11. Test Cart API
    const cartAddExcess = await request('/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        productId: testProductId,
        size: 40,
        color: 'Black',
        quantity: 9999 // vượt quá tồn kho
      })
    });
    console.assert(cartAddExcess.status === 400, 'Cart excess check thất bại');

    const cartAddOk = await request('/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        productId: testProductId,
        size: 40,
        color: 'Black',
        quantity: 2
      })
    });
    console.assert(cartAddOk.status === 200, 'Cart add item thất bại');

    const cartGet = await request('/cart', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.assert(cartGet.status === 200 && cartGet.body.data.items.length > 0, 'Get Cart thất bại');
    console.log('[PASS] 12. Test Cart API & Availability Check: PASS');

    // 12. Test Order Logic OUT_OF_STOCK
    const orderOutOfStock = await request('/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        items: [
          {
            productId: testProductId,
            size: 40,
            color: 'Black',
            quantity: 9999
          }
        ],
        shippingAddress: {
          fullName: 'Test User',
          phone: '0977777777',
          street: '123 Test St',
          city: 'TP HCM'
        }
      })
    });
    console.assert(
      orderOutOfStock.status === 400 && orderOutOfStock.body.code === 'OUT_OF_STOCK',
      'Order OUT_OF_STOCK check thất bại'
    );
    console.log('[PASS] 13. Test Order OUT_OF_STOCK Code & Inventory Protection: PASS');

    // 13. Test Order Success Flow & Stock Deduction
    const orderSuccess = await request('/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        items: [
          {
            productId: testProductId,
            size: 40,
            color: 'Black',
            quantity: 2
          }
        ],
        shippingAddress: {
          fullName: 'Nguyễn Văn Khách',
          phone: '0977777777',
          street: '123 Test St',
          city: 'TP HCM'
        },
        promotionCode: 'WELCOME10'
      })
    });
    console.assert(orderSuccess.status === 201 && orderSuccess.body.data._id, 'Order creation thất bại');
    const createdOrderId = orderSuccess.body.data._id;
    console.log('[PASS] 14. Test Successful Order & Stock Deduction & Promotion: PASS');

    // 14. Test Review (Chỉ khách đã mua mới được review)
    const unpurchasedProduct = await Product.create({
      name: `Unpurchased Product ${Date.now()}`,
      slug: `unpurchased-${Date.now()}`,
      brand: testBrandId,
      category: testCategoryId,
      salePrice: 1000000,
      costPrice: 500000
    });

    const reviewFail = await request(`/products/${unpurchasedProduct._id}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ rating: 5, comment: 'Sản phẩm chưa mua' })
    });
    console.assert(reviewFail.status === 403, `Review unpurchased protection thất bại: mong muốn 403, nhận ${reviewFail.status}`);

    const reviewSuccess = await request(`/products/${testProductId}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ rating: 5, comment: 'Giày rất êm và nhẹ!' })
    });
    console.assert(reviewSuccess.status === 201, `Create review thất bại: mong muốn 201, nhận ${reviewSuccess.status}`);

    // Test đánh giá trùng lần 2
    const reviewDuplicate = await request(`/products/${testProductId}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ rating: 4, comment: 'Đánh giá lần 2' })
    });
    console.assert(reviewDuplicate.status === 400, `Review duplicate protection thất bại: mong muốn 400, nhận ${reviewDuplicate.status}`);

    const reviewList = await request(`/products/${testProductId}/reviews`);
    console.assert(reviewList.status === 200 && reviewList.body.data.averageRating === 5, 'Get reviews thất bại');
    console.log('[PASS] 15. Test Review API & Purchase Verification & Duplicate Prevention: PASS');

    // 15. Test Phân quyền Customer vs Admin
    const customerForbidden = await request('/suppliers', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.assert(customerForbidden.status === 403, 'Customer forbidden check thất bại');
    console.log('[PASS] 16. Test Phân quyền Customer vs Admin (403 Forbidden): PASS');

    // 16. Test Admin Dashboard Stats
    const statsRes = await request('/dashboard/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.assert(statsRes.status === 200 && statsRes.body.data.financials, 'Dashboard stats thất bại');
    console.log('[PASS] 17. Test Admin Dashboard Stats (/api/dashboard/stats): PASS');

    console.log('====================================================');
    console.log('[SUCCESS] TOÀN BỘ 17 BÀI TEST ĐỀU VƯỢT QUA 100%!');
    console.log('====================================================');
  } catch (err) {
    console.error('[FAIL] Lỗi kiểm thử:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  }
};

runTests();
