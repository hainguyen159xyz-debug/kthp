/**
 * ==========================================================================
 * SPORTZONE ADMIN - PURCHASE ORDERS CONTROLLER (JIT REPLENISHMENT)
 * ==========================================================================
 */

let currentPoPage = 1;
const poLimit = 15;
let allSuppliersList = [];
let allProductsList = [];
let purchaseOrdersList = [];
let viewingPo = null;

async function initPurchaseOrders() {
  await Promise.all([loadSuppliersList(), loadProductsList()]);
  setupPoEvents();
  loadPurchaseOrders(1);
}

// Load Suppliers for PO form
async function loadSuppliersList() {
  try {
    const res = await adminApi.get('/suppliers');
    allSuppliersList = res.data || [];
    const select = document.getElementById('po-supplier');
    if (!select) return;

    allSuppliersList.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s._id;
      opt.textContent = `${s.name} (${s.phone})`;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error('Lỗi load suppliers:', e);
  }
}

// Load Products for item select
async function loadProductsList() {
  try {
    const res = await adminApi.get('/products', { status: 'active', limit: 100 });
    allProductsList = res.data || [];
  } catch (e) {
    console.error('Lỗi load products for PO:', e);
  }
}

// Load POs
async function loadPurchaseOrders(page = 1) {
  currentPoPage = page;
  const tbody = document.getElementById('po-table-body');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 40px;">Đang tải danh sách phiếu nhập...</td></tr>`;

  const status = document.getElementById('po-filter-status').value;

  const params = {
    page,
    limit: poLimit,
    status
  };

  try {
    const res = await adminApi.get('/purchase-orders', params);
    if (!res || !res.success) throw new Error('Không thể tải phiếu nhập');

    purchaseOrdersList = res.data || [];
    const pagination = res.pagination || { page: 1, limit: poLimit, total: purchaseOrdersList.length, totalPages: 1 };

    applyPoClientSearch(pagination);
  } catch (err) {
    console.error('Lỗi load POs:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger); padding: 30px;">${err.message || 'Lỗi nạp dữ liệu'}</td></tr>`;
  }
}

function applyPoClientSearch(pagination) {
  const q = document.getElementById('po-search').value.toLowerCase().trim();
  let filtered = [...purchaseOrdersList];

  if (q) {
    filtered = filtered.filter((po) => {
      const code = (po.poCode || po._id).toLowerCase();
      const sup = (po.supplier?.name || '').toLowerCase();
      return code.includes(q) || sup.includes(q);
    });
  }

  renderPoTable(filtered);
  renderPoPagination(pagination);
}

function renderPoTable(pos) {
  const tbody = document.getElementById('po-table-body');
  if (pos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 40px;">Không có phiếu nhập nào phù hợp</td></tr>`;
    return;
  }

  const statusMap = {
    pending: { label: 'Chờ xử lý', badge: 'badge-neutral' },
    sent: { label: 'Đã gửi NCC', badge: 'badge-info' },
    sent_to_supplier: { label: 'Đã gửi NCC', badge: 'badge-info' },
    confirmed: { label: 'NCC xác nhận', badge: 'badge-purple' },
    supplier_confirmed: { label: 'NCC xác nhận', badge: 'badge-purple' },
    receiving: { label: 'Đang nhập hàng', badge: 'badge-warning' },
    in_transit: { label: 'Đang vận chuyển', badge: 'badge-warning' },
    received: { label: '✓ ĐÃ NHẬP KHO', badge: 'badge-success' },
    cancelled: { label: 'Đã hủy', badge: 'badge-danger' }
  };

  tbody.innerHTML = pos.map((po) => {
    const st = statusMap[po.status] || { label: po.status, badge: 'badge-neutral' };
    const supName = po.supplier?.name || 'Nhà cung cấp đã xóa';
    const itemsCount = po.items ? po.items.length : 0;

    return `
      <tr>
        <td>
          <a href="javascript:void(0)" onclick="viewPoDetail('${po._id}')" style="font-weight: 700; color: #818cf8; font-family: monospace;">
            ${po.poCode || po._id.slice(-6).toUpperCase()}
          </a>
        </td>
        <td><strong>${supName}</strong></td>
        <td>${itemsCount} mặt hàng</td>
        <td><strong style="color: #34d399;">${formatCurrency(po.totalAmount || po.totalCost || 0)}</strong></td>
        <td><span class="badge ${st.badge}">${st.label}</span></td>
        <td>${formatDate(po.createdAt)}</td>
        <td>${po.receivedAt ? `<span style="color: var(--success); font-size: 0.82rem;">${formatDateTime(po.receivedAt)}</span>` : '<span style="color: var(--text-dim);">Chưa nhập</span>'}</td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm" onclick="viewPoDetail('${po._id}')">
            Chi tiết / Cập nhật →
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderPoPagination({ page, limit, total, totalPages }) {
  const infoEl = document.getElementById('po-pagination-info');
  const controlsEl = document.getElementById('po-pagination-controls');

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  infoEl.textContent = `Hiển thị ${start} - ${end} trên tổng số ${total} phiếu nhập`;

  controlsEl.innerHTML = '';
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.innerHTML = '&lt;';
  prevBtn.disabled = page <= 1;
  prevBtn.onclick = () => loadPurchaseOrders(page - 1);
  controlsEl.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      const pBtn = document.createElement('button');
      pBtn.className = `page-btn ${i === page ? 'active' : ''}`;
      pBtn.textContent = i;
      pBtn.onclick = () => loadPurchaseOrders(i);
      controlsEl.appendChild(pBtn);
    }
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.innerHTML = '&gt;';
  nextBtn.disabled = page >= totalPages;
  nextBtn.onclick = () => loadPurchaseOrders(page + 1);
  controlsEl.appendChild(nextBtn);
}

// Open Create PO Modal
function openCreatePoModal() {
  const container = document.getElementById('po-items-container');
  container.innerHTML = '';
  document.getElementById('po-supplier').value = '';
  document.getElementById('po-note').value = '';
  document.getElementById('po-total-preview').textContent = '0 ₫';

  addPoItemRow();
  adminModal.open('po-create-modal');
}

// Add Item Row to PO
function addPoItemRow() {
  const container = document.getElementById('po-items-container');
  const rowId = 'po-row-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

  const productOptions = allProductsList.map((p) =>
    `<option value="${p._id}" data-price="${p.costPrice || 0}">${p.name}</option>`
  ).join('');

  const row = document.createElement('div');
  row.className = 'po-item-row';
  row.id = rowId;

  row.innerHTML = `
    <div>
      <select class="form-control form-control-sm po-item-prod" required>
        <option value="">-- Chọn sản phẩm --</option>
        ${productOptions}
      </select>
    </div>
    <div>
      <input type="number" class="form-control form-control-sm po-item-size" placeholder="Size" value="40" min="30" max="50" required>
    </div>
    <div>
      <input type="text" class="form-control form-control-sm po-item-color" placeholder="Màu sắc" value="Đen" required>
    </div>
    <div>
      <input type="number" class="form-control form-control-sm po-item-qty" placeholder="SL" value="10" min="1" required>
    </div>
    <div>
      <input type="number" class="form-control form-control-sm po-item-cost" placeholder="Giá nhập (₫)" value="1000000" min="0" required>
    </div>
    <div>
      <button type="button" class="btn btn-danger-outline btn-sm btn-icon" onclick="document.getElementById('${rowId}').remove(); calculatePoTotalPreview();">
        &times;
      </button>
    </div>
  `;

  // Auto fill cost price on product select
  const selectEl = row.querySelector('.po-item-prod');
  const costEl = row.querySelector('.po-item-cost');
  selectEl.addEventListener('change', () => {
    const selectedOpt = selectEl.options[selectEl.selectedIndex];
    const cost = selectedOpt.getAttribute('data-price');
    if (cost) costEl.value = cost;
    calculatePoTotalPreview();
  });

  row.querySelector('.po-item-qty').addEventListener('input', calculatePoTotalPreview);
  costEl.addEventListener('input', calculatePoTotalPreview);

  container.appendChild(row);
  calculatePoTotalPreview();
}

function calculatePoTotalPreview() {
  let total = 0;
  const rows = document.querySelectorAll('.po-item-row');
  rows.forEach((r) => {
    const qty = Number(r.querySelector('.po-item-qty').value) || 0;
    const cost = Number(r.querySelector('.po-item-cost').value) || 0;
    total += qty * cost;
  });
  document.getElementById('po-total-preview').textContent = formatCurrency(total);
}

// View PO Detail and Status Changer
async function viewPoDetail(id) {
  try {
    const res = await adminApi.get(`/purchase-orders/${id}`);
    if (!res || !res.data) throw new Error('Không thể tải chi tiết phiếu nhập');

    viewingPo = res.data;
    document.getElementById('po-detail-title').textContent = `Phiếu Nhập Hàng #${viewingPo.poCode || viewingPo._id.slice(-6)}`;
    document.getElementById('po-detail-sup').textContent = viewingPo.supplier?.name || 'N/A';
    document.getElementById('po-detail-cost').textContent = formatCurrency(viewingPo.totalAmount || viewingPo.totalCost || 0);
    document.getElementById('po-detail-note').textContent = viewingPo.note || 'Không có ghi chú';

    const statusBadge = document.getElementById('po-detail-status-badge');
    statusBadge.innerHTML = `<span class="badge ${viewingPo.status === 'received' ? 'badge-success' : 'badge-warning'}">${viewingPo.status.toUpperCase()}</span>`;

    // Populate items
    const itemsTbody = document.getElementById('po-detail-items-table');
    const items = viewingPo.items || [];
    itemsTbody.innerHTML = items.map((it) => `
      <tr>
        <td><strong>${it.productName || it.product?.name || 'Sản phẩm'}</strong></td>
        <td><code>${it.variantSku || 'N/A'}</code></td>
        <td>Size ${it.size} - ${it.color}</td>
        <td><strong>${it.quantity}</strong></td>
        <td>${formatCurrency(it.costPrice || it.importPrice || 0)}</td>
        <td><strong style="color: #34d399;">${formatCurrency(it.subtotal || (it.quantity * (it.costPrice || 0)))}</strong></td>
      </tr>
    `).join('');

    // Pre-select current status
    const statusSelect = document.getElementById('select-update-po-status');
    statusSelect.value = viewingPo.status;

    adminModal.open('po-detail-modal');
  } catch (err) {
    adminToast.error(err.message || 'Lỗi khi tải chi tiết phiếu');
  }
}

function setupPoEvents() {
  document.getElementById('btn-open-create-po').addEventListener('click', openCreatePoModal);
  document.getElementById('btn-add-po-item').addEventListener('click', addPoItemRow);

  document.getElementById('po-search').addEventListener('input', () => {
    applyPoClientSearch({ page: currentPoPage, limit: poLimit, total: purchaseOrdersList.length, totalPages: 1 });
  });

  document.getElementById('po-filter-status').addEventListener('change', () => loadPurchaseOrders(1));

  document.getElementById('btn-reset-po').addEventListener('click', () => {
    document.getElementById('po-search').value = '';
    document.getElementById('po-filter-status').value = '';
    loadPurchaseOrders(1);
  });

  // Create PO Form Submit
  document.getElementById('po-create-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const supplier = document.getElementById('po-supplier').value;
    const note = document.getElementById('po-note').value.trim();

    const rows = document.querySelectorAll('.po-item-row');
    const items = [];

    rows.forEach((r) => {
      const productId = r.querySelector('.po-item-prod').value;
      const size = Number(r.querySelector('.po-item-size').value);
      const color = r.querySelector('.po-item-color').value.trim();
      const quantity = Number(r.querySelector('.po-item-qty').value);
      const costPrice = Number(r.querySelector('.po-item-cost').value);

      if (productId && size && color && quantity > 0) {
        items.push({
          productId,
          size,
          color,
          quantity,
          costPrice
        });
      }
    });

    if (!supplier) {
      adminToast.warning('Vui lòng chọn nhà cung cấp.');
      return;
    }

    if (items.length === 0) {
      adminToast.warning('Vui lòng thêm ít nhất một mặt hàng cần nhập.');
      return;
    }

    const saveBtn = document.getElementById('btn-save-po');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Đang tạo phiếu...';

    try {
      await adminApi.post('/purchase-orders', {
        supplierId: supplier,
        supplier,
        items,
        note
      });

      adminToast.success('Tạo phiếu yêu cầu nhập hàng (PO) thành công!');
      adminModal.close('po-create-modal');
      loadPurchaseOrders(1);
    } catch (err) {
      adminToast.error(err.message || 'Tạo phiếu nhập hàng thất bại');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Tạo Phiếu Nhập Hàng';
    }
  });

  // Status Changer Button
  document.getElementById('btn-submit-po-status').addEventListener('click', async () => {
    if (!viewingPo) return;
    const newStatus = document.getElementById('select-update-po-status').value;

    const executeStatusUpdate = async () => {
      try {
        const res = await adminApi.patch(`/purchase-orders/${viewingPo._id}/status`, {
          status: newStatus
        });

        if (newStatus === 'received') {
          adminToast.success('✓ Đã xác nhận nhập kho và TỰ ĐỘNG CẬP NHẬT TỒN KHO thành công!', 'Nhập kho hoàn tất');
        } else {
          adminToast.success(`Đã chuyển trạng thái phiếu sang "${newStatus}".`);
        }

        adminModal.close('po-detail-modal');
        loadPurchaseOrders(currentPoPage);
      } catch (err) {
        adminToast.error(err.message || 'Cập nhật trạng thái phiếu thất bại');
      }
    };

    if (newStatus === 'received') {
      adminModal.confirm({
        title: 'Xác nhận nhập kho & Tăng tồn kho',
        message: 'Bạn có chắc chắn muốn xác nhận lô hàng này đã nhập kho an toàn? Hệ thống sẽ tự động cộng số lượng vào tồn kho thực tế của các biến thể.',
        confirmText: 'Xác nhận nhập kho',
        isDanger: false,
        onConfirm: executeStatusUpdate
      });
    } else {
      executeStatusUpdate();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initPurchaseOrders();
});
