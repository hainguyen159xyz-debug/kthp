/**
 * ==========================================================================
 * SPORTZONE ADMIN - ORDERS CONTROLLER
 * ==========================================================================
 */

let currentOrderPage = 1;
const orderLimit = 15;
let ordersList = [];
let debounceTimer = null;

async function loadOrders(page = 1) {
  currentOrderPage = page;
  const tbody = document.getElementById('orders-table-body');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 40px;">Đang tải danh sách đơn hàng...</td></tr>`;

  const status = document.getElementById('order-filter-status').value;
  const fulfillmentStatus = document.getElementById('order-filter-fulfillment').value;

  const params = {
    page,
    limit: orderLimit,
    status,
    fulfillmentStatus
  };

  try {
    const res = await adminApi.get('/admin/orders', params);
    if (!res || !res.success) throw new Error('Không thể tải danh sách đơn hàng');

    ordersList = res.data || [];
    const pagination = res.pagination || { page: 1, limit: orderLimit, total: ordersList.length, totalPages: 1 };

    applyOrderClientFilter(pagination);
  } catch (err) {
    console.error('Lỗi load orders:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger); padding: 30px;">${err.message || 'Lỗi nạp đơn hàng'}</td></tr>`;
  }
}

function applyOrderClientFilter(pagination) {
  const q = document.getElementById('order-search').value.toLowerCase().trim();
  let filtered = [...ordersList];

  if (q) {
    filtered = filtered.filter((o) => {
      const code = (o.orderCode || o._id).toLowerCase();
      const name = (o.user?.fullName || o.customer?.fullName || o.user?.name || o.customer?.name || '').toLowerCase();
      const email = (o.user?.email || o.customer?.email || '').toLowerCase();
      const phone = (o.shippingAddress?.phone || o.user?.phone || '').toLowerCase();
      return code.includes(q) || name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }

  renderOrdersTable(filtered);
  renderOrderPagination(pagination);
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('orders-table-body');
  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 40px;">Không có đơn hàng nào phù hợp với bộ lọc</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map((o) => {
    const customer = o.user || o.customer || {};
    const customerName = customer.fullName || customer.name || 'Khách vãng lai';
    const customerPhone = o.shippingAddress?.phone || customer.phone || 'N/A';

    // Order status badges
    const statusMap = {
      pending: { label: 'Chờ xác nhận', badge: 'badge-warning' },
      processing: { label: 'Đang xử lý', badge: 'badge-info' },
      shipping: { label: 'Đang giao', badge: 'badge-purple' },
      completed: { label: 'Đã giao', badge: 'badge-success' },
      delivered: { label: 'Đã giao', badge: 'badge-success' },
      cancelled: { label: 'Đã hủy', badge: 'badge-danger' }
    };
    const st = statusMap[o.orderStatus || o.status] || { label: o.orderStatus || o.status, badge: 'badge-neutral' };

    // Fulfillment JIT badges
    const jitMap = {
      in_stock: { label: 'Sẵn hàng kho', badge: 'badge-success' },
      waiting_supplier: { label: 'Chờ NCC', badge: 'badge-warning' },
      fulfilled: { label: 'Đã đáp ứng', badge: 'badge-info' }
    };
    const jit = jitMap[o.fulfillmentStatus] || { label: o.fulfillmentStatus || 'N/A', badge: 'badge-neutral' };

    // Payment badge
    const isPaid = o.paymentStatus === 'paid';
    const payBadge = isPaid
      ? '<span class="badge badge-success">Đã thanh toán</span>'
      : '<span class="badge badge-warning">Chưa thanh toán</span>';

    return `
      <tr>
        <td>
          <a href="/admin/order-detail.html?id=${o._id}" style="font-weight: 700; color: #818cf8; font-family: monospace;">
            ${o.orderCode || o._id.slice(-6).toUpperCase()}
          </a>
        </td>
        <td>
          <div><strong>${customerName}</strong></div>
          <div style="font-size: 0.78rem; color: var(--text-dim);">${customerPhone}</div>
        </td>
        <td>${formatDateTime(o.createdAt)}</td>
        <td><strong style="color: #34d399;">${formatCurrency(o.totalAmount || 0)}</strong></td>
        <td>${payBadge}</td>
        <td><span class="badge ${jit.badge}">${jit.label}</span></td>
        <td><span class="badge ${st.badge}">${st.label}</span></td>
        <td style="text-align: right;">
          <a href="/admin/order-detail.html?id=${o._id}" class="btn btn-secondary btn-sm">
            Chi tiết & Xử lý →
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

function renderOrderPagination({ page, limit, total, totalPages }) {
  const infoEl = document.getElementById('order-pagination-info');
  const controlsEl = document.getElementById('order-pagination-controls');

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  infoEl.textContent = `Hiển thị ${start} - ${end} trên tổng số ${total} đơn hàng`;

  controlsEl.innerHTML = '';
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.innerHTML = '&lt;';
  prevBtn.disabled = page <= 1;
  prevBtn.onclick = () => loadOrders(page - 1);
  controlsEl.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      const pBtn = document.createElement('button');
      pBtn.className = `page-btn ${i === page ? 'active' : ''}`;
      pBtn.textContent = i;
      pBtn.onclick = () => loadOrders(i);
      controlsEl.appendChild(pBtn);
    }
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.innerHTML = '&gt;';
  nextBtn.disabled = page >= totalPages;
  nextBtn.onclick = () => loadOrders(page + 1);
  controlsEl.appendChild(nextBtn);
}

function setupOrderEvents() {
  document.getElementById('order-search').addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      applyOrderClientFilter({ page: currentOrderPage, limit: orderLimit, total: ordersList.length, totalPages: 1 });
    }, 250);
  });

  document.getElementById('order-filter-status').addEventListener('change', () => loadOrders(1));
  document.getElementById('order-filter-fulfillment').addEventListener('change', () => loadOrders(1));

  document.getElementById('btn-reset-order').addEventListener('click', () => {
    document.getElementById('order-search').value = '';
    document.getElementById('order-filter-status').value = '';
    document.getElementById('order-filter-fulfillment').value = '';
    loadOrders(1);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupOrderEvents();
  loadOrders(1);
});
