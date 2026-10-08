/**
 * ==========================================================================
 * SPORTZONE ADMIN - ORDER DETAIL CONTROLLER
 * ==========================================================================
 */

let currentOrderId = null;
let currentOrderData = null;

async function initOrderDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  currentOrderId = urlParams.get('id');

  if (!currentOrderId) {
    adminToast.error('Không tìm thấy ID đơn hàng trong URL.');
    setTimeout(() => {
      window.location.href = '/admin/orders.html';
    }, 1500);
    return;
  }

  setupEventListeners();
  await loadOrderInfo(currentOrderId);
}

async function loadOrderInfo(id) {
  try {
    const res = await adminApi.get(`/admin/orders/${id}`);
    if (!res || !res.success || !res.data) {
      throw new Error('Không thể tải thông tin đơn hàng');
    }

    currentOrderData = res.data;
    renderOrderPage(currentOrderData);
  } catch (err) {
    console.error('Lỗi load order detail:', err);
    adminToast.error(err.message || 'Lỗi khi tải chi tiết đơn hàng');
  }
}

function renderOrderPage(order) {
  const code = order.orderCode || order._id.slice(-6).toUpperCase();
  document.getElementById('breadcrumb-order-code').textContent = `#${code}`;
  document.getElementById('page-order-heading').textContent = `Đơn Hàng #${code}`;
  document.getElementById('page-order-date').textContent = `Thời gian đặt hàng: ${formatDateTime(order.createdAt)}`;

  // Timeline & Badges
  renderTimeline(order.orderStatus || order.status);

  // Items table
  const itemsTbody = document.getElementById('order-items-body');
  const items = order.items || [];
  if (items.length === 0) {
    itemsTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 30px;">Không có mặt hàng nào</td></tr>`;
  } else {
    itemsTbody.innerHTML = items.map((it) => {
      const p = it.product || {};
      const imgUrl = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100';
      const name = it.productName || p.name || 'Sản phẩm';
      const price = it.price || it.unitPrice || 0;
      const subtotal = it.subtotal || (price * (it.quantity || 1));

      return `
        <tr>
          <td>
            <div class="table-product-cell">
              <img src="${imgUrl}" alt="${name}" class="table-product-thumb" onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100'">
              <div class="table-product-info">
                <span class="table-product-name">${name}</span>
                <span class="table-product-sku">SKU: ${it.variantSku || 'N/A'}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="badge badge-neutral">Size ${it.size}</span>
            <span class="badge badge-neutral">${it.color}</span>
          </td>
          <td><strong>${it.quantity}</strong></td>
          <td>${formatCurrency(price)}</td>
          <td><strong style="color: #60a5fa;">${formatCurrency(subtotal)}</strong></td>
        </tr>
      `;
    }).join('');
  }

  // Financials
  document.getElementById('calc-subtotal').textContent = formatCurrency(order.subtotal || order.totalAmount || 0);
  document.getElementById('calc-discount').textContent = `-${formatCurrency(order.discountAmount || 0)}`;
  document.getElementById('calc-shipping').textContent = formatCurrency(order.shippingFee || 0);
  document.getElementById('calc-total').textContent = formatCurrency(order.totalAmount || 0);

  // Receiver Info
  const customer = order.user || order.customer || {};
  const addr = order.shippingAddress || {};
  const recipientName = addr.fullName || addr.name || customer.fullName || customer.name || 'Khách vãng lai';
  const recipientPhone = addr.phone || customer.phone || 'N/A';
  const recipientEmail = customer.email || 'N/A';
  
  let fullAddressStr = '';
  if (typeof addr === 'string') {
    fullAddressStr = addr;
  } else if (addr.fullAddress) {
    fullAddressStr = addr.fullAddress;
  } else {
    fullAddressStr = [addr.address, addr.ward, addr.district, addr.city].filter(Boolean).join(', ') || 'Chưa cung cấp địa chỉ cụ thể';
  }

  document.getElementById('recv-name').textContent = recipientName;
  document.getElementById('recv-phone').textContent = recipientPhone;
  document.getElementById('recv-email').textContent = recipientEmail;
  document.getElementById('recv-address').textContent = fullAddressStr;
  document.getElementById('recv-note').textContent = order.notes || addr.notes || 'Không có ghi chú thêm từ khách hàng';

  // Payment & JIT
  document.getElementById('pay-method').textContent = (order.paymentMethod || 'COD').toUpperCase();
  const isPaid = order.paymentStatus === 'paid';
  document.getElementById('pay-status').innerHTML = isPaid
    ? '<span class="badge badge-success">✓ Đã thanh toán</span>'
    : '<span class="badge badge-warning">⏳ Chờ thanh toán</span>';

  const jitMap = {
    in_stock: '<span class="badge badge-success">✓ Đã có sẵn trong kho</span>',
    waiting_supplier: '<span class="badge badge-warning">⚠️ Đang chờ nhập hàng từ NCC (JIT)</span>',
    fulfilled: '<span class="badge badge-info">✓ Đã đáp ứng hàng</span>'
  };
  document.getElementById('jit-fulfillment').innerHTML = jitMap[order.fulfillmentStatus] || `<span class="badge badge-neutral">${order.fulfillmentStatus || 'N/A'}</span>`;
}

function renderTimeline(status) {
  const steps = ['pending', 'processing', 'shipping', 'completed'];
  const stepElements = {
    pending: document.getElementById('step-pending'),
    processing: document.getElementById('step-processing'),
    shipping: document.getElementById('step-shipping'),
    completed: document.getElementById('step-completed')
  };

  const badgeEl = document.getElementById('badge-current-status');

  // Reset steps
  Object.values(stepElements).forEach((el) => {
    el.classList.remove('active', 'completed');
  });

  if (status === 'cancelled') {
    badgeEl.className = 'badge badge-danger';
    badgeEl.textContent = '🚫 ĐÃ HỦY ĐƠN HÀNG';
    return;
  }

  const statusMap = {
    pending: { label: 'Chờ xác nhận', badge: 'badge-warning', level: 0 },
    processing: { label: 'Đang xử lý / Đóng gói', badge: 'badge-info', level: 1 },
    shipping: { label: 'Đang vận chuyển', badge: 'badge-purple', level: 2 },
    completed: { label: 'Giao hàng thành công', badge: 'badge-success', level: 3 },
    delivered: { label: 'Giao hàng thành công', badge: 'badge-success', level: 3 }
  };

  const current = statusMap[status] || { label: status, badge: 'badge-neutral', level: 0 };
  badgeEl.className = `badge ${current.badge}`;
  badgeEl.textContent = current.label;

  steps.forEach((st, idx) => {
    const el = stepElements[st];
    if (idx < current.level) {
      el.classList.add('completed');
    } else if (idx === current.level) {
      el.classList.add('active');
    }
  });
}

function openStatusModal() {
  if (!currentOrderData) return;
  document.getElementById('update-order-status').value = currentOrderData.orderStatus || currentOrderData.status || 'pending';
  document.getElementById('update-payment-status').value = currentOrderData.paymentStatus || 'pending';
  document.getElementById('update-fulfillment-status').value = currentOrderData.fulfillmentStatus || 'in_stock';
  adminModal.open('status-modal');
}

function setupEventListeners() {
  document.getElementById('btn-open-status-update').addEventListener('click', openStatusModal);

  document.getElementById('status-update-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderStatus = document.getElementById('update-order-status').value;
    const paymentStatus = document.getElementById('update-payment-status').value;
    const fulfillmentStatus = document.getElementById('update-fulfillment-status').value;

    const performUpdate = async () => {
      const saveBtn = document.getElementById('btn-save-order-status');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Đang lưu...';

      try {
        await adminApi.patch(`/admin/orders/${currentOrderId}/status`, {
          orderStatus,
          status: orderStatus,
          paymentStatus,
          fulfillmentStatus
        });

        adminToast.success('Cập nhật trạng thái đơn hàng thành công!');
        adminModal.close('status-modal');
        await loadOrderInfo(currentOrderId);
      } catch (err) {
        adminToast.error(err.message || 'Cập nhật trạng thái thất bại');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Lưu Thay Đổi';
      }
    };

    if (orderStatus === 'cancelled') {
      adminModal.confirm({
        title: 'Hủy đơn hàng',
        message: 'Bạn có chắc chắn muốn chuyển trạng thái đơn hàng sang "ĐÃ HỦY"? Hành động này sẽ thông báo cho khách hàng.',
        confirmText: 'Xác nhận hủy',
        isDanger: true,
        onConfirm: performUpdate
      });
    } else {
      performUpdate();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initOrderDetail();
});
