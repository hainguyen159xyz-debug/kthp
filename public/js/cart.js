/**
 * CART CONTROLLER (cart.html)
 * Sport Shoes E-Commerce & Inventory Management Platform
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Kiểm tra đăng nhập
  if (!window.api.isLoggedIn()) {
    showLoginPrompt();
    return;
  }

  // Elements
  const emptyState = document.getElementById('cart-empty-state');
  const contentGrid = document.getElementById('cart-content-grid');
  const countLabel = document.getElementById('cart-item-count-label');
  const tbody = document.getElementById('cart-items-tbody');
  const subtotalEl = document.getElementById('cart-subtotal-price');
  const discountRow = document.getElementById('cart-discount-row');
  const discountAmountEl = document.getElementById('cart-discount-amount');
  const finalTotalEl = document.getElementById('cart-final-total');
  const btnClearCart = document.getElementById('btn-clear-cart');
  const couponInput = document.getElementById('cart-coupon-input');
  const btnApplyCoupon = document.getElementById('btn-apply-coupon');
  const couponMsg = document.getElementById('coupon-message');
  const btnCheckout = document.getElementById('btn-proceed-checkout');

  let cart = null;
  let appliedCoupon = JSON.parse(sessionStorage.getItem('appliedCoupon') || 'null');

  // Load giỏ hàng
  await loadCart();

  // Xóa toàn bộ giỏ
  if (btnClearCart) {
    btnClearCart.onclick = async () => {
      const ok = await window.modal.confirm({
        title: 'Xóa giỏ hàng',
        message: 'Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng không?',
        confirmText: 'Xóa sạch',
        cancelText: 'Giữ lại'
      });

      if (ok) {
        try {
          await window.api.delete('/cart');
          appliedCoupon = null;
          sessionStorage.removeItem('appliedCoupon');
          window.toast.success('Đã làm trống giỏ hàng.');
          window.dispatchEvent(new Event('cartChange'));
          await loadCart();
        } catch (err) {
          window.toast.error('Không thể xóa giỏ hàng.');
        }
      }
    };
  }

  // Áp dụng mã giảm giá
  if (btnApplyCoupon && couponInput) {
    if (appliedCoupon) {
      couponInput.value = appliedCoupon.code;
    }

    btnApplyCoupon.onclick = async () => {
      const code = couponInput.value.trim().toUpperCase();
      if (!code) {
        window.toast.warning('Vui lòng nhập mã giảm giá.');
        return;
      }

      if (!cart || !cart.items || cart.items.length === 0) {
        window.toast.warning('Giỏ hàng trống, không thể áp dụng mã.');
        return;
      }

      const subtotal = calculateSubtotal(cart.items);

      try {
        btnApplyCoupon.disabled = true;
        const res = await window.api.post('/promotions/apply', {
          code,
          orderAmount: subtotal
        });

        if (res.success && res.data) {
          appliedCoupon = res.data;
          sessionStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));

          couponMsg.style.color = 'var(--color-success)';
          couponMsg.textContent = `Đã áp dụng mã "${appliedCoupon.code}": Giảm ${window.api.formatCurrency(appliedCoupon.discountAmount)}`;
          window.toast.success(`Áp dụng mã ${appliedCoupon.code} thành công!`);

          updateSummary(subtotal);
        }
      } catch (err) {
        appliedCoupon = null;
        sessionStorage.removeItem('appliedCoupon');
        couponMsg.style.color = 'var(--color-danger)';
        couponMsg.textContent = err.message || 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện.';
        window.toast.error(err.message || 'Mã giảm giá không hợp lệ.');
        updateSummary(subtotal);
      } finally {
        btnApplyCoupon.disabled = false;
      }
    };
  }

  /**
   * Tải giỏ hàng từ API
   */
  async function loadCart() {
    try {
      const res = await window.api.get('/cart');
      if (res.success && res.data) {
        cart = res.data;
        renderCartUI();
      }
    } catch (err) {
      window.toast.error('Không thể tải giỏ hàng.');
    }
  }

  /**
   * Render dữ liệu giỏ hàng ra giao diện
   */
  function renderCartUI() {
    const items = cart.items || [];
    const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

    if (items.length === 0) {
      emptyState.style.display = 'block';
      contentGrid.style.display = 'none';
      btnClearCart.style.display = 'none';
      countLabel.textContent = '0 sản phẩm';
      return;
    }

    emptyState.style.display = 'none';
    contentGrid.style.display = 'grid';
    btnClearCart.style.display = 'inline-flex';
    countLabel.textContent = `${totalItemsCount} sản phẩm trong giỏ hàng của bạn`;

    tbody.innerHTML = items.map((item) => {
      const p = item.product || {};
      const thumb = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600';
      const itemSubtotal = item.price * item.quantity;

      return `
        <tr>
          <td>
            <div class="cart-item-info">
              <div class="cart-item-thumb">
                <img src="${thumb}" alt="${p.name || 'Sản phẩm'}">
              </div>
              <div class="cart-item-details">
                <h4><a href="/product-detail.html?id=${p._id}">${p.name || 'Giày thể thao'}</a></h4>
                <div class="cart-item-variant">Size: <strong>${item.size}</strong> • Màu: <strong>${item.color}</strong></div>
              </div>
            </div>
          </td>
          <td>
            <div class="qty-control">
              <button type="button" class="qty-btn" onclick="updateItemQuantity('${item._id}', ${item.quantity - 1})">-</button>
              <input type="text" class="qty-input" value="${item.quantity}" readonly>
              <button type="button" class="qty-btn" onclick="updateItemQuantity('${item._id}', ${item.quantity + 1})">+</button>
            </div>
          </td>
          <td>
            <span style="font-weight: 600;">${window.api.formatCurrency(item.price)}</span>
          </td>
          <td>
            <strong style="color: var(--color-primary); font-size: 1.05rem;">
              ${window.api.formatCurrency(itemSubtotal)}
            </strong>
          </td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="removeItem('${item._id}')" title="Xóa" style="color: var(--color-danger); border-color: rgba(239, 68, 68, 0.3);">
              Xóa
            </button>
          </td>
        </tr>
      `;
    }).join('');

    const subtotal = calculateSubtotal(items);
    updateSummary(subtotal);
  }

  function calculateSubtotal(items) {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function updateSummary(subtotal) {
    subtotalEl.textContent = window.api.formatCurrency(subtotal);

    let discount = 0;
    if (appliedCoupon && appliedCoupon.discountAmount) {
      discount = appliedCoupon.discountAmount;
      discountRow.style.display = 'flex';
      discountAmountEl.textContent = `-${window.api.formatCurrency(discount)}`;
    } else {
      discountRow.style.display = 'none';
    }

    const finalTotal = Math.max(0, subtotal - discount);
    finalTotalEl.textContent = window.api.formatCurrency(finalTotal);
  }

  // Update item quantity
  window.updateItemQuantity = async (itemId, newQty) => {
    if (newQty <= 0) {
      window.removeItem(itemId);
      return;
    }

    try {
      const res = await window.api.put(`/cart/items/${itemId}`, { quantity: newQty });
      if (res.success && res.data) {
        cart = res.data;
        window.dispatchEvent(new Event('cartChange'));
        renderCartUI();
      }
    } catch (err) {
      window.toast.error(err.message || 'Không thể cập nhật số lượng vượt quá tồn kho.');
    }
  };

  // Remove item
  window.removeItem = async (itemId) => {
    try {
      const res = await window.api.delete(`/cart/items/${itemId}`);
      if (res.success && res.data) {
        cart = res.data;
        window.toast.success('Đã xóa sản phẩm khỏi giỏ hàng.');
        window.dispatchEvent(new Event('cartChange'));
        renderCartUI();
      }
    } catch (err) {
      window.toast.error('Không thể xóa sản phẩm.');
    }
  };

  function showLoginPrompt() {
    emptyState.style.display = 'block';
    emptyState.innerHTML = `
      <h3 class="empty-state-title">Vui lòng đăng nhập để xem giỏ hàng</h3>
      <p class="empty-state-desc">Đăng nhập tài khoản giúp bạn lưu giữ các sản phẩm đã chọn và thanh toán thuận tiện hơn.</p>
      <a href="/login.html?redirect=${encodeURIComponent('/cart.html')}" class="btn btn-primary">Đăng nhập ngay</a>
    `;
    contentGrid.style.display = 'none';
    countLabel.textContent = 'Cần đăng nhập';
  }
});
