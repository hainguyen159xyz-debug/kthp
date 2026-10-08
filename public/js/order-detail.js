/**
 * ORDER DETAIL CONTROLLER (order-detail.html)
 * Sport Shoes E-Commerce & Inventory Management Platform
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.auth.requireAuth()) return;

  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  if (!orderId) {
    window.location.href = '/orders.html';
    return;
  }

  // Elements
  const breadcrumbEl = document.getElementById('order-detail-breadcrumb');
  const codeEl = document.getElementById('order-detail-code');
  const badgeEl = document.getElementById('order-detail-badge');
  const dateEl = document.getElementById('order-detail-date');
  const itemsContainer = document.getElementById('order-detail-items-list');
  const receiverInfoEl = document.getElementById('order-receiver-info');
  const subtotalEl = document.getElementById('order-subtotal');
  const discountRow = document.getElementById('order-discount-row');
  const discountEl = document.getElementById('order-discount');
  const paymentMethodEl = document.getElementById('order-payment-method');
  const paymentStatusEl = document.getElementById('order-payment-status');
  const totalAmountEl = document.getElementById('order-total-amount');

  try {
    const res = await window.api.get(`/orders/${orderId}`);
    if (res.success && res.data) {
      const order = res.data;

      document.title = `Đơn hàng ${order.orderCode} - SportZone`;
      breadcrumbEl.textContent = order.orderCode;
      codeEl.textContent = `Đơn hàng #${order.orderCode}`;

      const dateStr = new Date(order.createdAt).toLocaleString('vi-VN');
      dateEl.textContent = `Ngày đặt hàng: ${dateStr}`;

      const currStatus = order.orderStatus || order.status || 'pending';
      const statusMap = {
        pending: { text: 'Chờ xác nhận', class: 'badge-low-stock' },
        processing: { text: 'Đang chuẩn bị', class: 'badge-brand' },
        shipping: { text: 'Đang giao hàng', class: 'badge-brand' },
        completed: { text: 'Đã hoàn thành', class: 'badge-in-stock' },
        cancelled: { text: 'Đã hủy', class: 'badge-out-of-stock' }
      };

      const badgeInfo = statusMap[currStatus] || { text: currStatus, class: 'badge-secondary' };
      badgeEl.className = `badge ${badgeInfo.class}`;
      badgeEl.textContent = badgeInfo.text;

      // Update Timeline
      updateTimeline(currStatus);

      // Render Items
      itemsContainer.innerHTML = (order.items || []).map((it) => {
        const p = it.product || {};
        const thumb = (p.images && p.images[0]) || '/images/shoes/1.jpg';
        const lineTotal = it.subtotal || it.price * it.quantity;

        return `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; padding-bottom: 14px; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; align-items: center; gap: 14px;">
              <img src="${thumb}" alt="${it.productName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
              <div>
                <h4 style="font-size: 0.98rem; font-weight: 700; margin-bottom: 4px;">
                  <a href="/product-detail.html?id=${p._id || p}">${it.productName}</a>
                </h4>
                <div style="font-size: 0.85rem; color: var(--text-dim);">
                  Size: <strong>${it.size}</strong> • Màu: <strong>${it.color}</strong> • Số lượng: <strong>x${it.quantity}</strong>
                </div>
                <div style="font-size: 0.88rem; color: var(--text-muted); margin-top: 2px;">
                  Đơn giá: ${window.api.formatCurrency(it.price)}
                </div>
              </div>
            </div>
            <strong style="font-size: 1.05rem; color: var(--text-main);">
              ${window.api.formatCurrency(lineTotal)}
            </strong>
          </div>
        `;
      }).join('');

      // Render Receiver Info
      const addr = order.shippingAddress || {};
      receiverInfoEl.innerHTML = `
        <p><strong>Người nhận:</strong> ${addr.fullName || '---'}</p>
        <p><strong>Số điện thoại:</strong> ${addr.phone || '---'}</p>
        <p><strong>Địa chỉ:</strong> ${addr.street || ''}${addr.district ? `, ${addr.district}` : ''}, ${addr.city || ''}</p>
        ${addr.note ? `<p style="margin-top: 6px; font-style: italic;"><strong>Ghi chú:</strong> "${addr.note}"</p>` : ''}
      `;

      // Render Financials
      subtotalEl.textContent = window.api.formatCurrency(order.subtotal || order.totalAmount);
      if (order.discount > 0) {
        discountRow.style.display = 'flex';
        discountEl.textContent = `-${window.api.formatCurrency(order.discount)}`;
      } else {
        discountRow.style.display = 'none';
      }

      paymentMethodEl.textContent = order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng';
      paymentStatusEl.textContent = order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';
      paymentStatusEl.className = `badge ${order.paymentStatus === 'paid' ? 'badge-in-stock' : 'badge-low-stock'}`;

      totalAmountEl.textContent = window.api.formatCurrency(order.totalAmount);
    }
  } catch (err) {
    window.toast.error('Không tìm thấy đơn hàng.');
  }

  function updateTimeline(status) {
    const s1 = document.getElementById('timeline-step-1');
    const s2 = document.getElementById('timeline-step-2');
    const s3 = document.getElementById('timeline-step-3');
    const s4 = document.getElementById('timeline-step-4');

    if (status === 'cancelled') {
      s1.querySelector('.timeline-label').textContent = 'Đơn đã hủy';
      s1.className = 'timeline-step active';
      s1.querySelector('.timeline-node').textContent = 'X';
      s1.querySelector('.timeline-node').style.background = 'var(--color-danger)';
      s2.style.display = 'none';
      s3.style.display = 'none';
      s4.style.display = 'none';
      return;
    }

    if (status === 'pending') {
      s1.className = 'timeline-step active';
    } else if (status === 'processing') {
      s1.className = 'timeline-step completed';
      s2.className = 'timeline-step active';
    } else if (status === 'shipping') {
      s1.className = 'timeline-step completed';
      s2.className = 'timeline-step completed';
      s3.className = 'timeline-step active';
    } else if (status === 'completed') {
      s1.className = 'timeline-step completed';
      s2.className = 'timeline-step completed';
      s3.className = 'timeline-step completed';
      s4.className = 'timeline-step completed';
    }
  }
});
