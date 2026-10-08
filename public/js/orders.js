/**
 * ORDERS CONTROLLER (orders.html)
 * Sport Shoes E-Commerce & Inventory Management Platform
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.auth.requireAuth()) return;

  const tabsNav = document.getElementById('order-status-tabs');
  const container = document.getElementById('orders-list-container');
  const emptyState = document.getElementById('orders-empty-state');

  let orders = [];
  let currentFilter = 'all';

  // Load orders
  await fetchMyOrders();

  // Tab click handlers
  if (tabsNav) {
    tabsNav.querySelectorAll('.order-tab-btn').forEach((btn) => {
      btn.onclick = () => {
        tabsNav.querySelectorAll('.order-tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.status;
        renderOrders();
      };
    });
  }

  async function fetchMyOrders() {
    try {
      const res = await window.api.get('/orders');
      if (res.success && res.data) {
        orders = res.data;
        renderOrders();
      }
    } catch (err) {
      window.toast.error('Không thể tải lịch sử đơn hàng.');
      container.innerHTML = '<p class="text-muted" style="text-align: center;">Có lỗi xảy ra khi tải dữ liệu.</p>';
    }
  }

  function renderOrders() {
    let filtered = orders;
    if (currentFilter !== 'all') {
      filtered = orders.filter((o) => (o.orderStatus || o.status) === currentFilter);
    }

    if (filtered.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    container.innerHTML = filtered.map((order) => {
      const dateStr = new Date(order.createdAt).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      const statusMap = {
        pending: { text: 'Chờ xác nhận', class: 'badge-low-stock' },
        processing: { text: 'Đang xử lý', class: 'badge-brand' },
        shipping: { text: 'Đang giao hàng', class: 'badge-brand' },
        completed: { text: 'Đã hoàn thành', class: 'badge-in-stock' },
        cancelled: { text: 'Đã hủy', class: 'badge-out-of-stock' }
      };

      const currStatus = order.orderStatus || order.status || 'pending';
      const statusBadge = statusMap[currStatus] || { text: currStatus, class: 'badge-secondary' };

      const itemsHtml = (order.items || []).map((it) => {
        const p = it.product || {};
        const thumb = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600';
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${thumb}" alt="${it.productName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
              <div>
                <strong>${it.productName}</strong>
                <div style="font-size: 0.82rem; color: var(--text-dim);">Size: ${it.size} • Màu: ${it.color} • x${it.quantity}</div>
              </div>
            </div>
            <strong>${window.api.formatCurrency(it.subtotal || it.price * it.quantity)}</strong>
          </div>
        `;
      }).join('');

      return `
        <div class="order-card">
          <div class="order-card-header">
            <div>
              <span class="order-code-badge">${order.orderCode}</span>
              <span style="font-size: 0.85rem; color: var(--text-dim); margin-left: 12px;">Đặt lúc: ${dateStr}</span>
            </div>
            <div>
              <span class="badge ${statusBadge.class}">${statusBadge.text}</span>
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            ${itemsHtml}
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: gap: 12px; margin-top: 14px;">
            <div>
              <span style="font-size: 0.9rem; color: var(--text-muted);">Tổng thanh toán: </span>
              <strong style="color: var(--color-primary); font-size: 1.2rem;">${window.api.formatCurrency(order.totalAmount)}</strong>
              <span style="font-size: 0.82rem; color: var(--text-dim); margin-left: 10px;">(${order.paymentMethod || 'COD'})</span>
            </div>

            <a href="/order-detail.html?id=${order._id}" class="btn btn-secondary btn-sm">
              Xem chi tiết đơn hàng
            </a>
          </div>
        </div>
      `;
    }).join('');
  }
});
