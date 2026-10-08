/**
 * ==========================================================================
 * SPORTZONE ADMIN - PRODUCTS CONTROLLER
 * ==========================================================================
 */

let currentPage = 1;
const limit = 10;
let debounceTimer = null;

async function initProductsPage() {
  await Promise.all([loadCategoriesFilter(), loadBrandsFilter()]);
  setupEventListeners();
  loadProducts(1);
}

// Load Categories for dropdown filter
async function loadCategoriesFilter() {
  try {
    const res = await adminApi.get('/categories');
    const select = document.getElementById('filter-category');
    if (!select || !res.data) return;

    res.data.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat._id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error('Lỗi nạp danh mục filter:', e);
  }
}

// Load Brands for dropdown filter
async function loadBrandsFilter() {
  try {
    const res = await adminApi.get('/brands');
    const select = document.getElementById('filter-brand');
    if (!select || !res.data) return;

    res.data.forEach((b) => {
      const opt = document.createElement('option');
      opt.value = b._id;
      opt.textContent = b.name;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error('Lỗi nạp thương hiệu filter:', e);
  }
}

// Load Products from API
async function loadProducts(page = 1) {
  currentPage = page;
  const tbody = document.getElementById('products-table-body');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 40px;">Đang tải danh sách...</td></tr>`;

  const search = document.getElementById('filter-search').value.trim();
  const category = document.getElementById('filter-category').value;
  const brand = document.getElementById('filter-brand').value;
  const status = document.getElementById('filter-status').value;
  const sortVal = document.getElementById('filter-sort').value;

  const [sortBy, order] = sortVal.split('-');

  const params = {
    page,
    limit,
    search,
    category,
    brand,
    status,
    sortBy,
    order
  };

  try {
    const res = await adminApi.get('/products', params);
    if (!res || !res.success) throw new Error('Không thể lấy danh sách sản phẩm');

    const products = res.data || [];
    const pagination = res.pagination || { page: 1, limit, total: products.length, totalPages: 1 };

    renderProductsTable(products);
    renderPagination(pagination);
  } catch (err) {
    console.error('Lỗi load products:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger); padding: 30px;">${err.message || 'Lỗi khi tải dữ liệu'}</td></tr>`;
  }
}

// Render Products Table
function renderProductsTable(products) {
  const tbody = document.getElementById('products-table-body');
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 40px;">Không tìm thấy sản phẩm nào phù hợp với bộ lọc</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map((p) => {
    const imgUrl = (p.images && p.images[0]) || '/images/shoes/1.jpg';
    const brandName = p.brand?.name || 'Chưa gán';
    const catName = p.category?.name || 'Chưa gán';
    const isActive = p.status === 'active' || p.isActive !== false;
    const variantsCount = p.variants ? p.variants.length : 0;

    return `
      <tr>
        <td>
          <div class="table-product-cell">
            <img src="${imgUrl}" alt="${p.name}" class="table-product-thumb" onerror="this.src='/images/shoes/1.jpg'">
            <div class="table-product-info">
              <span class="table-product-name" title="${p.name}">${p.name}</span>
              <span class="table-product-sku">Slug: ${p.slug} ${variantsCount > 0 ? `• (${variantsCount} biến thể)` : ''}</span>
            </div>
          </div>
        </td>
        <td>
          <div><strong>${brandName}</strong></div>
          <div style="font-size: 0.78rem; color: var(--text-dim);">${catName}</div>
        </td>
        <td><span style="color: var(--text-muted);">${formatCurrency(p.costPrice || 0)}</span></td>
        <td><strong style="color: #60a5fa;">${formatCurrency(p.salePrice || 0)}</strong></td>
        <td>
          <span class="badge ${p.stock > 5 ? 'badge-success' : (p.stock > 0 ? 'badge-warning' : 'badge-danger')}">
            ${p.stock || 0} đôi
          </span>
        </td>
        <td>
          <span class="badge ${isActive ? 'badge-success' : 'badge-neutral'}">
            ${isActive ? 'Đang bán' : 'Tạm ẩn'}
          </span>
        </td>
        <td style="color: var(--text-dim); font-size: 0.8rem;">
          ${formatDate(p.createdAt)}
        </td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <a href="/admin/product-form.html?id=${p._id}" class="btn btn-secondary btn-sm" title="Chỉnh sửa sản phẩm">
              Sửa
            </a>
            <button class="btn btn-danger-outline btn-sm" onclick="handleDeleteProduct('${p._id}', '${p.name.replace(/'/g, "\\'")}')">
              Xóa
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Render Pagination Controls
function renderPagination({ page, limit, total, totalPages }) {
  const infoEl = document.getElementById('pagination-info');
  const controlsEl = document.getElementById('pagination-controls');

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  infoEl.textContent = `Hiển thị ${start} - ${end} trên tổng số ${total} sản phẩm`;

  controlsEl.innerHTML = '';
  if (totalPages <= 1) return;

  // Nút Prev
  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.innerHTML = '&lt;';
  prevBtn.disabled = page <= 1;
  prevBtn.onclick = () => loadProducts(page - 1);
  controlsEl.appendChild(prevBtn);

  // Số trang
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      const pBtn = document.createElement('button');
      pBtn.className = `page-btn ${i === page ? 'active' : ''}`;
      pBtn.textContent = i;
      pBtn.onclick = () => loadProducts(i);
      controlsEl.appendChild(pBtn);
    } else if (i === page - 2 || i === page + 2) {
      const dots = document.createElement('span');
      dots.style.color = 'var(--text-dim)';
      dots.style.padding = '0 4px';
      dots.textContent = '...';
      controlsEl.appendChild(dots);
    }
  }

  // Nút Next
  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.innerHTML = '&gt;';
  nextBtn.disabled = page >= totalPages;
  nextBtn.onclick = () => loadProducts(page + 1);
  controlsEl.appendChild(nextBtn);
}

// Xóa sản phẩm
function handleDeleteProduct(productId, productName) {
  adminModal.confirm({
    title: 'Xóa sản phẩm',
    message: `Bạn có chắc chắn muốn xóa sản phẩm "${productName}"? Hành động này không thể hoàn tác.`,
    confirmText: 'Xác nhận xóa',
    isDanger: true,
    onConfirm: async () => {
      try {
        await adminApi.delete(`/products/${productId}`);
        adminToast.success(`Đã xóa sản phẩm "${productName}" thành công.`);
        loadProducts(currentPage);
      } catch (err) {
        adminToast.error(err.message || 'Không thể xóa sản phẩm này.');
      }
    }
  });
}

// Thiết lập Listeners
function setupEventListeners() {
  const searchInput = document.getElementById('filter-search');
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loadProducts(1);
    }, 350);
  });

  document.getElementById('filter-category').addEventListener('change', () => loadProducts(1));
  document.getElementById('filter-brand').addEventListener('change', () => loadProducts(1));
  document.getElementById('filter-status').addEventListener('change', () => loadProducts(1));
  document.getElementById('filter-sort').addEventListener('change', () => loadProducts(1));

  document.getElementById('btn-reset-filter').addEventListener('click', () => {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-brand').value = '';
    document.getElementById('filter-status').value = 'all';
    document.getElementById('filter-sort').value = 'createdAt-desc';
    loadProducts(1);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initProductsPage();
});
