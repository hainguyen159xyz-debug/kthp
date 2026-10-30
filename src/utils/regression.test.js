const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Product = require('../models/Product');
const Order = require('../models/Order');
const inventory = require('../services/inventory.service');
const products = require('../controllers/product.controller');
const orders = require('../controllers/order.controller');

function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

test('combined product filters match price, size and color on one variant', async () => {
  const originalFind = Product.find;
  const originalCount = Product.countDocuments;
  let filter;
  const chain = { populate() { return this; }, skip() { return this; }, limit() { return this; }, sort() { return []; } };
  Product.find = (query) => { filter = query; return chain; };
  Product.countDocuments = async () => 0;
  try {
    await products.getProducts({ query: { minPrice: '100', maxPrice: '200', size: '39', color: 'Blue' } }, response(), error => { throw error; });
    assert.deepEqual(filter.$or[0].variants.$elemMatch, { price: { $gte: 100, $lte: 200 }, size: 39, color: { $regex: 'Blue', $options: 'i' } });
    assert.equal(filter.$or[1]['variants.0'].$exists, false);
  } finally { Product.find = originalFind; Product.countDocuments = originalCount; }
});

test('saving to wishlist is idempotent and dispatches a change event', () => {
  const storage = new Map();
  const events = [];
  const window = { dispatchEvent(event) { events.push(event.type); } };
  const localStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) };
  vm.runInNewContext(fs.readFileSync(require.resolve('../../public/js/api.js'), 'utf8'), { window, localStorage, Event: class { constructor(type) { this.type = type; } } });
  window.api.wishlist.add({ _id: 'shoe-1' });
  window.api.wishlist.add({ _id: 'shoe-1' });
  assert.equal(window.api.wishlist.count(), 1);
  assert.deepEqual(events, ['wishlistChange']);
});

test('order cancellation, reactivation, completion and invalid statuses', async () => {
  const originals = { find: Order.findById, update: Order.findByIdAndUpdate, replenish: inventory.replenishStock, deduct: inventory.deductStock, check: inventory.checkItemAvailability };
  let currentStatus = 'pending';
  let sufficient = true;
  let replenished = 0;
  let deducted = 0;
  let updated;
  Order.findById = async () => ({ orderStatus: currentStatus, items: [{ product: 'shoe', size: 39, color: 'Blue', quantity: 2 }] });
  const chain = { populate() { return this; }, then(resolve) { resolve(updated); } };
  Order.findByIdAndUpdate = (id, fields, options) => { assert.equal(options.runValidators, true); updated = fields; return chain; };
  inventory.replenishStock = async () => { replenished++; };
  inventory.deductStock = async () => { deducted++; };
  inventory.checkItemAvailability = async () => ({ isSufficient: sufficient });
  const run = async body => { const res = response(); await orders.updateOrderStatus({ params: { id: 'test' }, body }, res, e => { throw e; }); return res; };
  try {
    await run({ status: 'cancelled' });
    assert.equal(replenished, 1);
    assert.equal(updated.fulfillmentStatus, 'cancelled');
    currentStatus = 'cancelled'; sufficient = false;
    assert.equal((await run({ status: 'processing' })).statusCode, 400);
    assert.equal(deducted, 0);
    sufficient = true;
    await run({ status: 'processing' });
    assert.equal(deducted, 1);
    assert.equal(updated.fulfillmentStatus, 'in_stock');
    currentStatus = 'processing';
    await run({ status: 'completed' });
    assert.equal(updated.fulfillmentStatus, 'delivered');
    assert.equal((await run({ status: 'invalid' })).statusCode, 400);
    assert.equal((await run({ paymentStatus: 'pending' })).statusCode, 400);
  } finally {
    Order.findById = originals.find; Order.findByIdAndUpdate = originals.update;
    inventory.replenishStock = originals.replenish; inventory.deductStock = originals.deduct; inventory.checkItemAvailability = originals.check;
  }
});
