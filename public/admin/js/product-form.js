/**
 * ==========================================================================
 * SPORTZONE ADMIN - PRODUCT FORM CONTROLLER (CREATE & UPDATE)
 * ==========================================================================
 */

let editProductId = null;

async function initProductForm() {
  const urlParams = new URLSearchParams(window.location.search);
  editProductId = urlParams.get('id');

  // Load brands and categories first
  await Promise.all([loadBrandsSelect(), loadCategoriesSelect()]);

  if (editProductId) {
    document.getElementById('breadcrumb-current-action').textContent = 'Chỉnh Sửa';
    document.getElementById('form-heading').textContent = 'Chỉnh Sửa Sản Phẩm';
    document.title = 'Chỉnh Sửa Sản Phẩm - SportZone Admin';
    await loadProductData(editProductId);
  } else {
    // Thêm sẵn 1 dòng biến thể mặc định
    addVariantRow({
      sku: 'SKU-40-BLK',
      color: 'Đen',
      size: 40,
      stockQuantity: 10,
      lowStockThreshold: 2
    });
  }

  setupFormHandlers();
}

// Load Brands Select
async function loadBrandsSelect() {
  try {
    const res = await adminApi.get('/brands');
    const select = document.getElementById('prod-brand');
    if (!select || !res.data) return;

    res.data.forEach((b) => {
      const opt = document.createElement('option');
      opt.value = b._id;
      opt.textContent = b.name;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error('Lỗi load brands:', e);
  }
}

// Load Categories Select
async function loadCategoriesSelect() {
  try {
    const res = await adminApi.get('/categories');
    const select = document.getElementById('prod-category');
    if (!select || !res.data) return;

    res.data.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat._id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error('Lỗi load categories:', e);
  }
}

// Load Existing Product Data
async function loadProductData(id) {
  try {
    const res = await adminApi.get(`/products/${id}`);
    if (!res || !res.data) throw new Error('Không tìm thấy thông tin sản phẩm');

    const p = res.data;
    document.getElementById('prod-name').value = p.name || '';
    document.getElementById('prod-brand').value = p.brand?._id || p.brand || '';
    document.getElementById('prod-category').value = p.category?._id || p.category || '';
    document.getElementById('prod-cost-price').value = p.costPrice || 0;
    document.getElementById('prod-sale-price').value = p.salePrice || 0;
    document.getElementById('prod-description').value = p.description || '';

    if (p.images && p.images.length > 0) {
      document.getElementById('prod-images').value = p.images.join('\n');
    }

    document.getElementById('prod-is-active').checked = p.status === 'active' || p.isActive !== false;
    document.getElementById('prod-is-featured').checked = !!p.featured;
    document.getElementById('prod-is-fast-moving').checked = !!p.isFastMoving;

    // Render variants
    const container = document.getElementById('variants-container');
    container.innerHTML = '';

    if (p.variants && p.variants.length > 0) {
      p.variants.forEach((v) => addVariantRow(v));
    } else {
      addVariantRow({
        sku: `SKU-${p.name.slice(0, 3).toUpperCase()}-40`,
        color: (p.colors && p.colors[0]) || 'Đen',
        size: (p.sizes && p.sizes[0]) || 40,
        stockQuantity: p.stock || 0,
        lowStockThreshold: 2
      });
    }
  } catch (err) {
    console.error('Lỗi nạp sản phẩm:', err);
    adminToast.error(err.message || 'Không thể tải thông tin sản phẩm');
  }
}

// Add Variant Row HTML
function addVariantRow(data = {}) {
  const container = document.getElementById('variants-container');
  const rowId = 'variant-row-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

  const row = document.createElement('div');
  row.className = 'variant-row';
  row.id = rowId;

  row.innerHTML = `
    <div>
      <input type="text" class="form-control form-control-sm variant-sku" placeholder="Mã SKU" value="${data.sku || ''}" required>
    </div>
    <div>
      <input type="text" class="form-control form-control-sm variant-color" placeholder="Màu sắc (vd: Đen)" value="${data.color || ''}" required>
    </div>
    <div>
      <input type="number" class="form-control form-control-sm variant-size" placeholder="Size" value="${data.size || 40}" min="30" max="50" required>
    </div>
    <div>
      <input type="number" class="form-control form-control-sm variant-qty" placeholder="Tồn kho" value="${data.stockQuantity !== undefined ? data.stockQuantity : 10}" min="0" required>
    </div>
    <div>
      <input type="number" class="form-control form-control-sm variant-threshold" placeholder="Ngưỡng" value="${data.lowStockThreshold || 2}" min="0">
    </div>
    <div>
      <button type="button" class="btn btn-danger-outline btn-sm btn-icon" title="Xóa biến thể này" onclick="document.getElementById('${rowId}').remove()">
        &times;
      </button>
    </div>
  `;

  container.appendChild(row);
}

// Setup Form Handlers
function setupFormHandlers() {
  document.getElementById('btn-add-variant').addEventListener('click', () => {
    addVariantRow();
  });

  const form = document.getElementById('product-form');
  const saveBtn = document.getElementById('btn-save-product');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('prod-name').value.trim();
    const brand = document.getElementById('prod-brand').value;
    const category = document.getElementById('prod-category').value;
    const costPrice = Number(document.getElementById('prod-cost-price').value) || 0;
    const salePrice = Number(document.getElementById('prod-sale-price').value) || 0;
    const description = document.getElementById('prod-description').value.trim();
    const rawImages = document.getElementById('prod-images').value.trim();
    const isActive = document.getElementById('prod-is-active').checked;
    const isFeatured = document.getElementById('prod-is-featured').checked;
    const isFastMoving = document.getElementById('prod-is-fast-moving').checked;

    if (!name) {
      adminToast.warning('Vui lòng nhập tên sản phẩm.');
      return;
    }
    if (!brand) {
      adminToast.warning('Vui lòng chọn thương hiệu.');
      return;
    }
    if (!category) {
      adminToast.warning('Vui lòng chọn danh mục.');
      return;
    }
    if (salePrice < 0 || costPrice < 0) {
      adminToast.warning('Giá tiền không được là số âm.');
      return;
    }

    // Tách images
    const images = rawImages
      ? rawImages.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
      : [];

    // Thu thập variants
    const variantRows = document.querySelectorAll('.variant-row');
    const variants = [];
    const sizesSet = new Set();
    const colorsSet = new Set();
    let totalStock = 0;

    variantRows.forEach((r) => {
      const sku = r.querySelector('.variant-sku').value.trim().toUpperCase();
      const color = r.querySelector('.variant-color').value.trim();
      const size = Number(r.querySelector('.variant-size').value);
      const stockQuantity = Number(r.querySelector('.variant-qty').value) || 0;
      const lowStockThreshold = Number(r.querySelector('.variant-threshold').value) || 2;

      if (sku && color && size) {
        variants.push({
          sku,
          color,
          size,
          stockQuantity,
          lowStockThreshold,
          price: salePrice,
          importPrice: costPrice
        });
        sizesSet.add(size);
        colorsSet.add(color);
        totalStock += stockQuantity;
      }
    });

    const payload = {
      name,
      brand,
      category,
      costPrice,
      salePrice,
      description,
      images,
      sizes: Array.from(sizesSet),
      colors: Array.from(colorsSet),
      stock: totalStock,
      status: isActive ? 'active' : 'inactive',
      isActive,
      featured: isFeatured,
      isFastMoving,
      variants
    };

    saveBtn.disabled = true;
    saveBtn.textContent = 'Đang lưu...';

    try {
      if (editProductId) {
        await adminApi.put(`/products/${editProductId}`, payload);
        adminToast.success('Cập nhật sản phẩm thành công!');
      } else {
        await adminApi.post('/products', payload);
        adminToast.success('Thêm sản phẩm mới thành công!');
      }

      setTimeout(() => {
        window.location.href = '/admin/products.html';
      }, 700);
    } catch (err) {
      console.error('Lỗi lưu sản phẩm:', err);
      adminToast.error(err.message || 'Không thể lưu sản phẩm.');
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Lưu Sản Phẩm';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initProductForm();
});
