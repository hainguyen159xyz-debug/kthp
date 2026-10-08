/**
 * ==========================================================================
 * SPORTZONE ADMIN - CUSTOMERS CONTROLLER
 * ==========================================================================
 */

let currentCustPage = 1;
const custLimit = 15;
let debounceTimer = null;

async function loadCustomers(page = 1) {
  currentCustPage = page;
  const tbody = document.getElementById('customers-table-body');
  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 40px;">Đang tải danh sách khách hàng...</td></tr>`;

  const search = document.getElementById('customer-search').value.trim();
  const status = document.getElementById('customer-status-filter').value;

  const params = {
    page,
    limit: custLimit,
    search,
    status
  };

  try {
    const res = await adminApi.get('/admin/customers', params);
    if (!res || !res.success) throw new Error('Không thể tải danh sách khách hàng');

    const customers = res.data || [];
    const pagination = res.pagination || { page: 1, limit: custLimit, total: customers.length, totalPages: 1 };

    renderCustomersTable(customers);
    renderCustPagination(pagination);
  } catch (err) {
    console.error('Lỗi load customers:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger); padding: 30px;">${err.message || 'Lỗi kết nối'}</td></tr>`;
  }
}

function renderCustomersTable(customers) {
  const tbody = document.getElementById('customers-table-body');
  if (customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 40px;">Không tìm thấy khách hàng nào</td></tr>`;
    return;
  }

  tbody.innerHTML = customers.map((c) => {
    const name = c.fullName || c.name || 'Khách vãng lai';
    const isBlocked = c.status === 'blocked';

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--bg-card); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff;">
              ${name.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong style="color: #fff;">${name}</strong>
              <div style="font-size: 0.78rem; color: var(--text-dim);">${c.email}</div>
            </div>
          </div>
        </td>
        <td>${c.phone || '<span style="color: var(--text-dim);">Chưa cập nhật</span>'}</td>
        <td style="color: var(--text-muted); font-size: 0.82rem;">${formatDate(c.createdAt)}</td>
        <td><strong>${c.orderCount || 0}</strong> đơn</td>
        <td><strong style="color: #34d399;">${formatCurrency(c.totalSpent || 0)}</strong></td>
        <td>
          <span class="badge ${isBlocked ? 'badge-danger' : 'badge-success'}">
            ${isBlocked ? 'Đã bị khóa' : 'Hoạt động'}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="viewCustomerDetail('${c._id}')">
              Xem
            </button>
            <button class="btn ${isBlocked ? 'btn-success' : 'btn-danger-outline'} btn-sm" onclick="toggleCustomerStatus('${c._id}', '${isBlocked ? 'active' : 'blocked'}', '${name.replace(/'/g, "\\'")}')">
              ${isBlocked ? 'Mở khóa' : 'Khóa'}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderCustPagination({ page, limit, total, totalPages }) {
  const infoEl = document.getElementById('customer-pagination-info');
  const controlsEl = document.getElementById('customer-pagination-controls');

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  infoEl.textContent = `Hiển thị ${start} - ${end} trên tổng số ${total} khách hàng`;

  controlsEl.innerHTML = '';
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.innerHTML = '&lt;';
  prevBtn.disabled = page <= 1;
  prevBtn.onclick = () => loadCustomers(page - 1);
  controlsEl.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      const pBtn = document.createElement('button');
      pBtn.className = `page-btn ${i === page ? 'active' : ''}`;
      pBtn.textContent = i;
      pBtn.onclick = () => loadCustomers(i);
      controlsEl.appendChild(pBtn);
    }
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.innerHTML = '&gt;';
  nextBtn.disabled = page >= totalPages;
  nextBtn.onclick = () => loadCustomers(page + 1);
  controlsEl.appendChild(nextBtn);
}

// Xem chi tiết khách hàng và lịch sử đơn hàng
async function viewCustomerDetail(id) {
  try {
    const res = await adminApi.get(`/admin/customers/${id}`);
    if (!res || !res.data) throw new Error('Không thể tải thông tin khách hàng');

    const { customer, orders } = res.data;
    const name = customer.fullName || customer.name || 'Khách hàng';

    document.getElementById('cust-modal-name').textContent = `Khách Hàng: ${name}`;
    document.getElementById('modal-cust-name').textContent = name;
    document.getElementById('modal-cust-email').textContent = customer.email;
    document.getElementById('modal-cust-phone').textContent = customer.phone || 'Chưa cập nhật';
    document.getElementById('modal-cust-date').textContent = formatDateTime(customer.createdAt);

    const isBlocked = customer.status === 'blocked';
    document.getElementById('modal-cust-status').innerHTML = `
      <span class="badge ${isBlocked ? 'badge-danger' : 'badge-success'}">
        ${isBlocked ? 'Đã bị khóa' : 'Hoạt động'}
      </span>
    `;

    // Render orders
    const ordersTbody = document.getElementById('modal-cust-orders');
    if (!orders || orders.length === 0) {
      ordersTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 20px;">Khách hàng chưa có đơn nào</td></tr>`;
    } else {
      ordersTbody.innerHTML = orders.map((o) => `
        <tr>
          <td><a href="/admin/order-detail.html?id=${o._id}" style="color: #818cf8; font-weight: 600;">#${o.orderCode || o._id.slice(-6)}</a></td>
          <td>${formatDate(o.createdAt)}</td>
          <td><strong style="color: #34d399;">${formatCurrency(o.totalAmount || 0)}</strong></td>
          <td><span class="badge badge-neutral">${o.orderStatus || o.status}</span></td>
        </tr>
      `).join('');
    }

    adminModal.open('customer-detail-modal');
  } catch (err) {
    adminToast.error(err.message || 'Lỗi khi tải chi tiết khách hàng');
  }
}

// Khóa hoặc Mở khóa tài khoản
function toggleCustomerStatus(id, newStatus, name) {
  const isLock = newStatus === 'blocked';
  adminModal.confirm({
    title: isLock ? 'Khóa tài khoản khách hàng' : 'Mở khóa tài khoản',
    message: isLock
      ? `Bạn có chắc chắn muốn khóa tài khoản "${name}"? Khách hàng này sẽ không thể đăng nhập hoặc đặt hàng.`
      : `Bạn có chắc chắn muốn mở khóa cho tài khoản "${name}"?`,
    confirmText: isLock ? 'Khóa tài khoản' : 'Mở khóa',
    isDanger: isLock,
    onConfirm: async () => {
      try {
        await adminApi.patch(`/admin/customers/${id}/status`, { status: newStatus });
        adminToast.success(`Đã cập nhật trạng thái tài khoản "${name}" thành công.`);
        loadCustomers(currentCustPage);
      } catch (err) {
        adminToast.error(err.message || 'Cập nhật trạng thái thất bại');
      }
    }
  });
}

function setupCustomerEvents() {
  const searchInput = document.getElementById('customer-search');
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loadCustomers(1);
    }, 300);
  });

  document.getElementById('customer-status-filter').addEventListener('change', () => loadCustomers(1));

  document.getElementById('btn-reset-customer').addEventListener('click', () => {
    document.getElementById('customer-search').value = '';
    document.getElementById('customer-status-filter').value = 'all';
    loadCustomers(1);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupCustomerEvents();
  loadCustomers(1);
});
