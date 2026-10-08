/**
 * ==========================================================================
 * SPORTZONE ADMIN - INVENTORY CONTROLLER (JIT WAREHOUSE)
 * ==========================================================================
 */

let currentInvPage = 1;
const invLimit = 15;
let inventoryItems = [];
let debounceTimer = null;

async function loadInventory(page = 1) {
  currentInvPage = page;
  const tbody = document.getElementById('inventory-table-body');
  tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-dim); padding: 40px;">Đang tải danh sách tồn kho...</td></tr>`;

  const statusFilter = document.getElementById('inventory-filter-status').value;
  const isLowStock = statusFilter === 'low' ? 'true' : undefined;

  const params = {
    page,
    limit: invLimit,
    lowStock: isLowStock
  };

  try {
    const res = await adminApi.get('/inventory', params);
    if (!res || !res.success) throw new Error('Không thể nạp dữ liệu kho');

    inventoryItems = res.data || [];
    const pagination = res.pagination || { page: 1, limit: invLimit, total: inventoryItems.length, totalPages: 1 };

    applyClientFiltersAndRender(pagination);
  } catch (err) {
    console.error('Lỗi load inventory:', err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--danger); padding: 30px;">${err.message || 'Lỗi kết nối'}</td></tr>`;
  }
}

function applyClientFiltersAndRender(pagination) {
  const search = document.getElementById('inventory-search').value.toLowerCase().trim();
  const statusFilter = document.getElementById('inventory-filter-status').value;
  const sizeFilter = document.getElementById('inventory-filter-size').value;

  let filtered = [...inventoryItems];

  if (search) {
    filtered = filtered.filter((item) => {
      const pName = item.product?.name ? item.product.name.toLowerCase() : '';
      const sku = item.sku ? item.sku.toLowerCase() : '';
      const color = item.color ? item.color.toLowerCase() : '';
      return pName.includes(search) || sku.includes(search) || color.includes(search);
    });
  }

  if (sizeFilter) {
    filtered = filtered.filter((item) => Number(item.size) === Number(sizeFilter));
  }

  if (statusFilter === 'out') {
    filtered = filtered.filter((item) => (item.availableQuantity || 0) === 0);
  } else if (statusFilter === 'low') {
    filtered = filtered.filter((item) => (item.availableQuantity || 0) > 0 && (item.availableQuantity || 0) <= (item.lowStockThreshold || 2));
  } else if (statusFilter === 'in') {
    filtered = filtered.filter((item) => (item.availableQuantity || 0) > (item.lowStockThreshold || 2));
  }

  renderInventoryTable(filtered);
  renderInvPagination(pagination);
}

function renderInventoryTable(items) {
  const tbody = document.getElementById('inventory-table-body');
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-dim); padding: 40px;">Không có biến thể nào phù hợp</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map((item) => {
    const p = item.product || {};
    const imgUrl = (p.images && p.images[0]) || '/images/shoes/1.jpg';
    const avail = item.availableQuantity !== undefined ? item.availableQuantity : Math.max(0, item.quantity - item.reservedQuantity);
    const threshold = item.lowStockThreshold || 2;

    let statusBadge = '';
    if (avail === 0) {
      statusBadge = '<span class="badge badge-danger">Hết hàng</span>';
    } else if (avail <= threshold) {
      statusBadge = '<span class="badge badge-warning">Sắp hết</span>';
    } else {
      statusBadge = '<span class="badge badge-success">Còn hàng</span>';
    }

    return `
      <tr>
        <td>
          <div class="table-product-cell">
            <img src="${imgUrl}" alt="${p.name || 'SP'}" class="table-product-thumb" onerror="this.src='/images/shoes/1.jpg'">
            <div class="table-product-info">
              <span class="table-product-name">${p.name || 'Sản phẩm đã xóa'}</span>
            </div>
          </div>
        </td>
        <td><code>${item.sku || 'N/A'}</code></td>
        <td>
          <span class="badge badge-neutral">Size ${item.size}</span>
          <span class="badge badge-neutral">${item.color}</span>
        </td>
        <td><strong style="color: #fff;">${item.quantity || 0}</strong></td>
        <td><span style="color: var(--warning);">${item.reservedQuantity || 0}</span></td>
        <td>
          <strong style="color: ${avail > 0 ? '#34d399' : '#f87171'}; font-size: 1rem;">
            ${avail}
          </strong>
        </td>
        <td style="color: var(--text-dim);">${threshold}</td>
        <td>${statusBadge}</td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="openEditInventory('${item._id}')">
              Điều chỉnh
            </button>
            <a href="/admin/purchase-orders.html" class="btn btn-primary btn-sm" title="Nhập hàng từ NCC">
              + Nhập NCC
            </a>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderInvPagination({ page, limit, total, totalPages }) {
  const infoEl = document.getElementById('inventory-pagination-info');
  const controlsEl = document.getElementById('inventory-pagination-controls');

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  infoEl.textContent = `Hiển thị ${start} - ${end} trên tổng số ${total} bản ghi kho`;

  controlsEl.innerHTML = '';
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.innerHTML = '&lt;';
  prevBtn.disabled = page <= 1;
  prevBtn.onclick = () => loadInventory(page - 1);
  controlsEl.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      const pBtn = document.createElement('button');
      pBtn.className = `page-btn ${i === page ? 'active' : ''}`;
      pBtn.textContent = i;
      pBtn.onclick = () => loadInventory(i);
      controlsEl.appendChild(pBtn);
    }
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.innerHTML = '&gt;';
  nextBtn.disabled = page >= totalPages;
  nextBtn.onclick = () => loadInventory(page + 1);
  controlsEl.appendChild(nextBtn);
}

function openEditInventory(id) {
  const item = inventoryItems.find((inv) => inv._id === id);
  if (!item) return;

  document.getElementById('inv-id').value = item._id;
  document.getElementById('inv-product-name').textContent = item.product?.name || 'Sản phẩm';
  document.getElementById('inv-sku').textContent = `SKU: ${item.sku} | Size: ${item.size} | Màu: ${item.color}`;
  document.getElementById('inv-quantity').value = item.quantity || 0;
  document.getElementById('inv-reserved').value = item.reservedQuantity || 0;
  document.getElementById('inv-threshold').value = item.lowStockThreshold || 2;

  adminModal.open('inventory-modal');
}

function setupInventoryEvents() {
  const searchInput = document.getElementById('inventory-search');
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      applyClientFiltersAndRender({ page: currentInvPage, limit: invLimit, total: inventoryItems.length, totalPages: 1 });
    }, 250);
  });

  document.getElementById('inventory-filter-status').addEventListener('change', () => loadInventory(1));
  document.getElementById('inventory-filter-size').addEventListener('change', () => {
    applyClientFiltersAndRender({ page: currentInvPage, limit: invLimit, total: inventoryItems.length, totalPages: 1 });
  });

  document.getElementById('btn-reset-inventory').addEventListener('click', () => {
    document.getElementById('inventory-search').value = '';
    document.getElementById('inventory-filter-status').value = 'all';
    document.getElementById('inventory-filter-size').value = '';
    loadInventory(1);
  });

  document.getElementById('inventory-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('inv-id').value;
    const quantity = Number(document.getElementById('inv-quantity').value);
    const reservedQuantity = Number(document.getElementById('inv-reserved').value);
    const lowStockThreshold = Number(document.getElementById('inv-threshold').value);

    const saveBtn = document.getElementById('btn-save-inv');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Đang lưu...';

    try {
      await adminApi.put(`/inventory/${id}`, {
        quantity,
        reservedQuantity,
        lowStockThreshold
      });

      adminToast.success('Cập nhật số lượng tồn kho thành công!');
      adminModal.close('inventory-modal');
      loadInventory(currentInvPage);
    } catch (err) {
      adminToast.error(err.message || 'Cập nhật kho thất bại');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Cập Nhật Tồn Kho';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupInventoryEvents();
  loadInventory(1);
});
