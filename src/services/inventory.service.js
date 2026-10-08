const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

/**
 * Lấy hoặc khởi tạo bản ghi Inventory cho (product, size, color)
 */
const getOrCreateInventory = async (productId, size, color, defaultSku = '') => {
  let inventory = await Inventory.findOne({
    product: productId,
    size: Number(size),
    color: color.trim()
  });

  if (!inventory) {
    // Tìm trong variants của product để lấy stock hiện có nếu có
    const product = await Product.findById(productId);
    let initialQty = 0;
    let initialSku = defaultSku;

    if (product && product.variants) {
      const variant = product.variants.find(
        (v) => Number(v.size) === Number(size) && v.color.toLowerCase() === color.trim().toLowerCase()
      );
      if (variant) {
        initialQty = variant.stockQuantity || 0;
        initialSku = variant.sku || defaultSku;
      }
    }

    inventory = await Inventory.create({
      product: productId,
      size: Number(size),
      color: color.trim(),
      sku: initialSku,
      quantity: initialQty,
      reservedQuantity: 0,
      availableQuantity: initialQty
    });
  }

  return inventory;
};

/**
 * Kiểm tra tồn kho khả dụng cho 1 mặt hàng
 */
const checkItemAvailability = async (productId, size, color, requestedQuantity) => {
  const inventory = await getOrCreateInventory(productId, size, color);
  const available = inventory.availableQuantity || 0;

  return {
    inventory,
    available,
    isSufficient: available >= requestedQuantity
  };
};

/**
 * Trừ tồn kho khi đơn hàng hoàn tất đặt
 */
const deductStock = async (productId, size, color, quantity) => {
  const inventory = await getOrCreateInventory(productId, size, color);

  inventory.quantity = Math.max(0, inventory.quantity - quantity);
  inventory.availableQuantity = Math.max(0, inventory.quantity - inventory.reservedQuantity);
  await inventory.save();

  // Đồng bộ sang Product và variants
  const product = await Product.findById(productId);
  if (product) {
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(
        (v) => Number(v.size) === Number(size) && v.color.toLowerCase() === color.trim().toLowerCase()
      );
      if (variant) {
        variant.stockQuantity = Math.max(0, variant.stockQuantity - quantity);
      }
    }
    product.stock = Math.max(0, (product.stock || 0) - quantity);
    product.totalSold = (product.totalSold || 0) + quantity;
    await product.save();
  }

  return inventory;
};

/**
 * Nhập thêm hàng vào kho (từ Phiếu Nhập PurchaseOrder)
 */
const replenishStock = async (productId, size, color, quantity, sku = '') => {
  const inventory = await getOrCreateInventory(productId, size, color, sku);

  inventory.quantity += quantity;
  inventory.availableQuantity = Math.max(0, inventory.quantity - inventory.reservedQuantity);
  if (sku && !inventory.sku) inventory.sku = sku;
  await inventory.save();

  // Đồng bộ sang Product
  const product = await Product.findById(productId);
  if (product) {
    if (product.variants && product.variants.length > 0) {
      let variant = product.variants.find(
        (v) => Number(v.size) === Number(size) && v.color.toLowerCase() === color.trim().toLowerCase()
      );
      if (variant) {
        variant.stockQuantity += quantity;
      } else {
        product.variants.push({
          sku: sku || `SKU-${size}-${color.toUpperCase().slice(0, 3)}`,
          size: Number(size),
          color: color.trim(),
          stockQuantity: quantity,
          price: product.salePrice || 0,
          importPrice: product.costPrice || 0
        });
      }
    }
    product.stock = (product.stock || 0) + quantity;
    await product.save();
  }

  return inventory;
};

module.exports = {
  getOrCreateInventory,
  checkItemAvailability,
  deductStock,
  replenishStock
};
