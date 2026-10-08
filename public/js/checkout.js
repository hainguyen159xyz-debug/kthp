/**
 * CHECKOUT CONTROLLER (checkout.html)
 * Sport Shoes E-Commerce & Inventory Management Platform
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.auth.requireAuth()) return;

  const user = window.api.getUser();
  let cart = null;
  const appliedCoupon = JSON.parse(sessionStorage.getItem('appliedCoupon') || 'null');

  // DOM Elements
  const fullNameInput = document.getElementById('checkout-fullname');
  const phoneInput = document.getElementById('checkout-phone');
  const cityInput = document.getElementById('checkout-city');
  const districtInput = document.getElementById('checkout-district');
  const streetInput = document.getElementById('checkout-street');
  const noteInput = document.getElementById('checkout-note');
  const itemsMiniList = document.getElementById('checkout-items-mini-list');
  const subtotalEl = document.getElementById('checkout-subtotal');
  const discountRow = document.getElementById('checkout-discount-row');
  const promoCodeEl = document.getElementById('checkout-promo-code');
  const discountValEl = document.getElementById('checkout-discount-val');
  const finalTotalEl = document.getElementById('checkout-final-total');
  const btnSubmit = document.getElementById('btn-submit-order');

  // Pre-fill user profile if available
  if (user) {
    if (fullNameInput) fullNameInput.value = user.fullName || user.name || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (user.address) {
      if (typeof user.address === 'string') {
        if (streetInput) streetInput.value = user.address;
      } else if (typeof user.address === 'object') {
        if (streetInput) streetInput.value = user.address.street || '';
        if (cityInput) cityInput.value = user.address.city || '';
        if (districtInput) districtInput.value = user.address.district || '';
      }
    }
  }

  // Load cart data
  await loadCartAndCalculate();

  // Submit order button
  if (btnSubmit) {
    btnSubmit.onclick = handleOrderSubmit;
  }

  /**
   * Tải giỏ hàng và tính toán tổng tiền
   */
  async function loadCartAndCalculate() {
    try {
      const res = await window.api.get('/cart');
      if (res.success && res.data) {
        cart = res.data;
        const items = cart.items || [];

        if (items.length === 0) {
          window.toast.warning('Giỏ hàng trống. Vui lòng chọn sản phẩm trước khi thanh toán.');
          setTimeout(() => {
            window.location.href = '/products.html';
          }, 1200);
          return;
        }

        // Render mini items
        itemsMiniList.innerHTML = items.map((item) => {
          const p = item.product || {};
          const thumb = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600';
          const lineTotal = item.price * item.quantity;

          return `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 0.88rem;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${thumb}" alt="${p.name}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px;">
                <div>
                  <strong style="display: block; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name || 'Sản phẩm'}</strong>
                  <span style="color: var(--text-dim); font-size: 0.78rem;">Size ${item.size} • ${item.color} • x${item.quantity}</span>
                </div>
              </div>
              <strong style="color: var(--text-main);">${window.api.formatCurrency(lineTotal)}</strong>
            </div>
          `;
        }).join('');

        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        subtotalEl.textContent = window.api.formatCurrency(subtotal);

        let discount = 0;
        if (appliedCoupon && appliedCoupon.discountAmount) {
          discount = appliedCoupon.discountAmount;
          discountRow.style.display = 'flex';
          promoCodeEl.textContent = appliedCoupon.code;
          discountValEl.textContent = `-${window.api.formatCurrency(discount)}`;
        } else {
          discountRow.style.display = 'none';
        }

        const finalTotal = Math.max(0, subtotal - discount);
        finalTotalEl.textContent = window.api.formatCurrency(finalTotal);
      }
    } catch (err) {
      window.toast.error('Lỗi khi tải thông tin giỏ hàng.');
    }
  }

  /**
   * Xử lý xác nhận đặt hàng
   */
  async function handleOrderSubmit() {
    const fullName = fullNameInput.value.trim();
    const phone = phoneInput.value.trim();
    const street = streetInput.value.trim();
    const city = cityInput.value.trim();
    const district = districtInput.value.trim();
    const note = noteInput.value.trim();
    const paymentMethodEl = document.querySelector('input[name="paymentMethod"]:checked');
    const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'COD';

    if (!fullName || !phone || !street || !city) {
      window.toast.error('Vui lòng điền đầy đủ Họ tên, SĐT, Địa chỉ và Tỉnh/Thành phố nhận hàng.');
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      window.toast.error('Giỏ hàng của bạn đang trống.');
      return;
    }

    const payload = {
      items: cart.items.map((item) => ({
        productId: item.product._id || item.product,
        size: item.size,
        color: item.color,
        quantity: item.quantity
      })),
      shippingAddress: {
        fullName,
        phone,
        street,
        city,
        district,
        note
      },
      paymentMethod,
      promotionCode: appliedCoupon ? appliedCoupon.code : '',
      shippingFee: 0
    };

    try {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Đang xử lý đặt hàng...';

      const res = await window.api.post('/orders', payload);

      if (res.success && res.data) {
        sessionStorage.removeItem('appliedCoupon');
        window.dispatchEvent(new Event('cartChange'));
        window.toast.success('Đặt hàng thành công! Đang chuyển hướng...');

        setTimeout(() => {
          window.location.href = `/order-detail.html?id=${res.data._id}&new=true`;
        }, 1000);
      }
    } catch (error) {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Xác nhận đặt hàng';

      // Xử lý mã lỗi đặc biệt: OUT_OF_STOCK
      if (error.code === 'OUT_OF_STOCK' && error.items) {
        const itemDetails = error.items.map((it) => `
          <li><strong>${it.productName || 'Sản phẩm'}</strong> (Size ${it.size}, Màu ${it.color}): Yêu cầu <strong>${it.requested}</strong> đôi nhưng kho hiện chỉ còn <strong>${it.available}</strong> đôi.</li>
        `).join('');

        await window.modal.confirm({
          title: 'Tồn kho không đủ',
          message: `
            <p style="margin-bottom: 12px; color: var(--color-danger); font-weight: 600;">Một hoặc nhiều sản phẩm trong giỏ hàng hiện không đủ số lượng tồn kho:</p>
            <ul style="padding-left: 20px; font-size: 0.9rem; line-height: 1.6; margin-bottom: 14px;">
              ${itemDetails}
            </ul>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Hệ thống đã tự động gửi tín hiệu tới nhà cung cấp để chuẩn bị nhập bổ sung. Vui lòng điều chỉnh số lượng hoặc kiểm tra lại sau ít phút.</p>
          `,
          confirmText: 'Về giỏ hàng điều chỉnh',
          cancelText: 'Đóng'
        });

        window.location.href = '/cart.html';
        return;
      }

      window.toast.error(error.message || 'Đặt hàng thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  }
});
