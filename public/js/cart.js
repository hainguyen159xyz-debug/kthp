/**
 * CART CONTROLLER (cart.html)
 * Sport Shoes E-Commerce & Inventory Management Platform - Modern SportZone
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const emptyState = document.getElementById('cart-empty-state');
  const contentGrid = document.getElementById('cart-content-grid');
  const countBadge = document.getElementById('cart-item-count-badge');
  const itemsContainer = document.getElementById('cart-items-container');
  const subtotalEl = document.getElementById('cart-subtotal-price');
  const discountRow = document.getElementById('cart-discount-row');
  const discountAmountEl = document.getElementById('cart-discount-amount');
  const finalTotalEl = document.getElementById('cart-final-total');
  const btnClearCart = document.getElementById('btn-clear-cart');
  const couponInput = document.getElementById('cart-coupon-input');
  const btnApplyCoupon = document.getElementById('btn-apply-coupon');
  const couponMsg = document.getElementById('coupon-message');
  const btnCheckout = document.getElementById('btn-proceed-checkout');

  // Trạng thái khóa để ngăn spam click liên tục gây sai lệch dữ liệu
  let isUpdating = false;
  let cart = null;
  let appliedCoupon = JSON.parse(sessionStorage.getItem('appliedCoupon') || 'null');

  // 1. Kiểm tra đăng nhập
  if (!window.api.isLoggedIn()) {
    showLoginPrompt();
    return;
  }

  // 2. Tải giỏ hàng lần đầu
  await loadCart();

  // 3. Sự kiện xóa sạch giỏ hàng
  if (btnClearCart) {
    btnClearCart.onclick = async () => {
      if (isUpdating) return;
      const ok = await window.modal.confirm({
        title: 'Xóa toàn bộ giỏ hàng',
        message: 'Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng không?',
        confirmText: 'Xóa tất cả',
        cancelText: 'Giữ lại'
      });

      if (ok) {
        try {
          isUpdating = true;
          await window.api.delete('/cart');
          appliedCoupon = null;
          sessionStorage.removeItem('appliedCoupon');
          window.toast.success('Đã làm trống giỏ hàng.');
          window.dispatchEvent(new Event('cartChange'));
          await loadCart();
        } catch (err) {
          window.toast.error('Không thể xóa giỏ hàng.');
        } finally {
          isUpdating = false;
        }
      }
    };
  }

  // 4. Áp dụng & Gỡ mã giảm giá
  if (btnApplyCoupon && couponInput) {
    if (appliedCoupon) {
      couponInput.value = appliedCoupon.code;
    }

    btnApplyCoupon.onclick = async () => {
      if (isUpdating) return;
      const code = couponInput.value.trim().toUpperCase();
      if (!code) {
        window.toast.warning('Vui lòng nhập mã giảm giá.');
        return;
      }

      if (!cart || !cart.items || cart.items.length === 0) {
        window.toast.warning('Giỏ hàng trống, không thể áp dụng mã giảm giá.');
        return;
      }

      const subtotal = calculateSubtotal(cart.items);

      try {
        isUpdating = true;
        btnApplyCoupon.disabled = true;
        btnApplyCoupon.textContent = '...';

        const res = await window.api.post('/promotions/apply', {
          code,
          orderAmount: subtotal
        });

        if (res.success && res.data) {
          appliedCoupon = res.data;
          sessionStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));

          couponMsg.style.color = '#059669';
          couponMsg.innerHTML = `
            <span>✓ Đã áp dụng mã <strong>${appliedCoupon.code}</strong>: Giảm ${window.api.formatCurrency(appliedCoupon.discountAmount)}</span>
            <button type="button" onclick="removeCoupon()" style="background:none;border:none;color:#DC2626;cursor:pointer;margin-left:6px;text-decoration:underline;font-size:0.78rem;">[Gỡ mã]</button>
          `;
          window.toast.success(`Áp dụng mã ${appliedCoupon.code} thành công!`);
          updateSummary(subtotal);
        }
      } catch (err) {
        appliedCoupon = null;
        sessionStorage.removeItem('appliedCoupon');
        couponMsg.style.color = '#DC2626';
        couponMsg.textContent = err.message || 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện.';
        window.toast.error(err.message || 'Mã giảm giá không hợp lệ.');
        updateSummary(subtotal);
      } finally {
        isUpdating = false;
        btnApplyCoupon.disabled = false;
        btnApplyCoupon.textContent = 'Áp dụng';
      }
    };
  }

  // Global handler gỡ mã giảm giá
  window.removeCoupon = () => {
    appliedCoupon = null;
    sessionStorage.removeItem('appliedCoupon');
    if (couponInput) couponInput.value = '';
    if (couponMsg) couponMsg.textContent = '';
    window.toast.info('Đã gỡ mã giảm giá.');
    if (cart && cart.items) {
      updateSummary(calculateSubtotal(cart.items));
    }
  };

  /**
   * Tải giỏ hàng từ API
   */
  async function loadCart() {
    try {
      const res = await window.api.get('/cart');
      if (res.success && res.data) {
        cart = res.data;
        renderCartUI();
      } else {
        renderCartUI();
      }
    } catch (err) {
      if (err.status === 401 || !window.api.isLoggedIn()) {
        showLoginPrompt();
      } else {
        window.toast.error('Không thể tải dữ liệu giỏ hàng.');
        if (countBadge) countBadge.textContent = '0 sản phẩm';
        if (emptyState) emptyState.style.display = 'block';
      }
    }
  }

  /**
   * Render dữ liệu giỏ hàng ra danh sách thẻ sản phẩm hiện đại
   */
  function renderCartUI() {
    const items = (cart && cart.items) || [];
    const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // Cập nhật số lượng trên Header
    if (countBadge) {
      countBadge.textContent = `${totalItemsCount} sản phẩm`;
    }

    // Nếu giỏ hàng trống
    if (items.length === 0) {
      renderEmptyState();
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (contentGrid) contentGrid.style.display = 'grid';
    if (btnClearCart) btnClearCart.style.display = 'inline-flex';

    if (itemsContainer) {
      itemsContainer.innerHTML = items.map((item) => {
        const p = item.product || {};
        const pId = p._id || '';
        const pName = p.name || 'Giày thể thao SportZone';

        // Xác định ảnh sản phẩm khớp với màu đã chọn
        let thumb = (p.images && p.images[0]) || '/images/shoes/1.jpg';
        if (p.colorVariants && p.colorVariants.length > 0 && item.color) {
          const cvMatch = p.colorVariants.find(
            (cv) => cv.color && cv.color.toLowerCase() === item.color.toLowerCase()
          );
          if (cvMatch && cvMatch.image) thumb = cvMatch.image;
        }

        const itemSubtotal = (Number(item.price) || 0) * item.quantity;
        const brandName = p.brand ? (p.brand.name || 'SPORTZONE') : (p.brandName || 'CHÍNH HÃNG');

        return `
          <div class="cart-item-card" id="cart-item-${item._id}">
            <a href="/product-detail.html?id=${pId}" class="cart-item-thumb-link" title="Xem chi tiết ${pName}">
              <img src="${thumb}" alt="${pName}" class="cart-item-img" onerror="this.src='/images/shoes/1.jpg'">
            </a>
            
            <div class="cart-item-content">
              <div class="cart-item-info">
                <div class="cart-item-meta-top">
                  <span class="cart-item-brand">${brandName}</span>
                  <span class="cart-stock-status">Còn hàng</span>
                </div>
                
                <h3 class="cart-item-title">
                  <a href="/product-detail.html?id=${pId}">${pName}</a>
                </h3>
                
                <div class="cart-item-specs">
                  <span class="spec-tag">Size: <strong>${item.size}</strong></span>
                  <span class="spec-tag">Màu: <strong>${item.color}</strong></span>
                </div>
                
                <div class="cart-item-price-unit">
                  Đơn giá: <strong>${window.api.formatCurrency(item.price)}</strong>
                </div>
              </div>

              <div class="cart-item-controls">
                <div class="cart-qty-wrapper">
                  <span class="qty-mobile-label">Số lượng:</span>
                  <div class="cart-qty-control">
                    <button type="button" 
                            class="btn-qty-step" 
                            ${item.quantity <= 1 ? 'disabled' : ''} 
                            onclick="updateItemQuantity('${item._id}', ${item.quantity - 1}, this)" 
                            title="Giảm số lượng" 
                            aria-label="Giảm số lượng">-</button>
                    <span class="cart-qty-val" id="qty-val-${item._id}">${item.quantity}</span>
                    <button type="button" 
                            class="btn-qty-step" 
                            onclick="updateItemQuantity('${item._id}', ${item.quantity + 1}, this)" 
                            title="Tăng số lượng" 
                            aria-label="Tăng số lượng">+</button>
                  </div>
                </div>

                <div class="cart-item-subtotal-block">
                  <span class="subtotal-mobile-label">Thành tiền</span>
                  <span class="cart-item-subtotal-val" id="subtotal-val-${item._id}">${window.api.formatCurrency(itemSubtotal)}</span>
                </div>

                <div class="cart-item-tools">
                  <button type="button" class="btn-tool-wishlist" onclick="saveItemToWishlist('${item._id}')" title="Chuyển vào danh sách yêu thích">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>Lưu</span>
                  </button>
                  <span class="tool-sep">|</span>
                  <button type="button" class="btn-tool-remove" onclick="removeItem('${item._id}')" title="Xóa khỏi giỏ hàng">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    const subtotal = calculateSubtotal(items);
    updateSummary(subtotal);
  }

  function calculateSubtotal(items) {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);
  }

  /**
   * Cập nhật tóm tắt đơn hàng (Summary Box)
   */
  function updateSummary(subtotal) {
    if (subtotalEl) {
      subtotalEl.textContent = window.api.formatCurrency(subtotal);
    }

    let discount = 0;
    if (appliedCoupon && appliedCoupon.discountAmount) {
      discount = appliedCoupon.discountAmount;
      if (discountRow) discountRow.style.display = 'flex';
      if (discountAmountEl) discountAmountEl.textContent = `-${window.api.formatCurrency(discount)}`;
    } else {
      if (discountRow) discountRow.style.display = 'none';
    }

    const finalTotal = Math.max(0, subtotal - discount);
    if (finalTotalEl) {
      finalTotalEl.textContent = window.api.formatCurrency(finalTotal);
    }
  }

  /**
   * Cập nhật số lượng sản phẩm (Có kiểm tra tồn kho & chống spam click)
   */
  window.updateItemQuantity = async (itemId, newQty, btnEl) => {
    if (isUpdating) return;
    
    // Quy tắc: Không cho số lượng nhỏ hơn 1; muốn xóa phải dùng nút xóa riêng
    if (newQty < 1) {
      window.toast.warning('Số lượng tối thiểu là 1. Nếu muốn xóa sản phẩm, vui lòng bấm nút "Xóa".');
      return;
    }

    try {
      isUpdating = true;
      if (btnEl) btnEl.style.opacity = '0.5';

      const res = await window.api.put(`/cart/items/${itemId}`, { quantity: newQty });
      if (res.success && res.data) {
        cart = res.data;
        window.dispatchEvent(new Event('cartChange'));
        renderCartUI();
      }
    } catch (err) {
      window.toast.error(err.message || 'Không thể cập nhật số lượng vượt quá tồn kho khả dụng.');
    } finally {
      isUpdating = false;
      if (btnEl) btnEl.style.opacity = '1';
    }
  };

  /**
   * Xóa sản phẩm khỏi giỏ hàng
   */
  window.removeItem = async (itemId) => {
    if (isUpdating) return;

    const ok = await window.modal.confirm({
      title: 'Xóa sản phẩm',
      message: 'Bạn có chắc chắn muốn bỏ sản phẩm này khỏi giỏ hàng?',
      confirmText: 'Bỏ sản phẩm',
      cancelText: 'Giữ lại'
    });

    if (!ok) return;

    try {
      isUpdating = true;
      const res = await window.api.delete(`/cart/items/${itemId}`);
      if (res.success && res.data) {
        cart = res.data;
        window.toast.success('Đã xóa sản phẩm khỏi giỏ hàng.');
        window.dispatchEvent(new Event('cartChange'));
        renderCartUI();
      }
    } catch (err) {
      window.toast.error(err.message || 'Không thể xóa sản phẩm.');
    } finally {
      isUpdating = false;
    }
  };

  /**
   * Chuyển sản phẩm vào danh sách yêu thích
   */
  window.saveItemToWishlist = async (itemId) => {
    if (isUpdating) return;

    if (!cart || !cart.items) return;
    const item = cart.items.find(i => i._id === itemId);
    if (!item || !item.product) return;

    try {
      isUpdating = true;
      // 1. Thêm vào danh sách yêu thích
      const productObj = item.product;
      window.api.wishlist.add(productObj);

      // 2. Xóa khỏi giỏ hàng
      const res = await window.api.delete(`/cart/items/${itemId}`);
      if (res.success && res.data) {
        cart = res.data;
        window.toast.success(`Đã chuyển đôi "${productObj.name || 'giày'}" vào danh sách yêu thích!`);
        window.dispatchEvent(new Event('cartChange'));
        renderCartUI();
      }
    } catch (err) {
      window.toast.error(err.message || 'Không thể chuyển sản phẩm.');
    } finally {
      isUpdating = false;
    }
  };

  /**
   * Trạng thái giỏ hàng trống chuyên nghiệp
   */
  function renderEmptyState() {
    if (emptyState) {
      emptyState.style.display = 'block';
      emptyState.innerHTML = `
        <div class="cart-empty-icon">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </div>
        <h2 class="cart-empty-title">Giỏ hàng của bạn đang trống</h2>
        <p class="cart-empty-desc">Bạn chưa thêm sản phẩm nào vào giỏ hàng. Hãy khám phá bộ sưu tập giày thể thao chính hãng mới nhất tại SportZone!</p>
        <div class="cart-empty-actions">
          <a href="/products.html" class="btn btn-primary btn-lg">
            Khám phá sản phẩm ngay
          </a>
        </div>
      `;
    }
    if (contentGrid) contentGrid.style.display = 'none';
    if (btnClearCart) btnClearCart.style.display = 'none';
    if (countBadge) countBadge.textContent = '0 sản phẩm';
  }

  /**
   * Trạng thái nhắc đăng nhập khi chưa đăng nhập
   */
  function showLoginPrompt() {
    if (emptyState) {
      emptyState.style.display = 'block';
      emptyState.innerHTML = `
        <div class="cart-empty-icon">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h2 class="cart-empty-title">Giỏ hàng của bạn đang trống</h2>
        <p class="cart-empty-desc">Hãy đăng nhập để xem giỏ hàng của bạn và tiếp tục quản lý các mẫu giày yêu thích đã lưu.</p>
        <div class="cart-empty-actions">
          <a href="/login.html?redirect=${encodeURIComponent('/cart.html')}" class="btn btn-primary btn-lg">
            Đăng nhập ngay
          </a>
          <a href="/products.html" class="btn btn-outline btn-lg">
            Khám phá sản phẩm
          </a>
        </div>
      `;
    }
    if (contentGrid) contentGrid.style.display = 'none';
    if (btnClearCart) btnClearCart.style.display = 'none';
    if (countBadge) countBadge.textContent = 'Chưa đăng nhập';
  }
});

