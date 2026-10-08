/**
 * PRODUCT DETAIL CONTROLLER (product-detail.html)
 * Sport Shoes E-Commerce & Inventory Management Platform
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    window.location.href = '/products.html';
    return;
  }

  let product = null;
  let selectedSize = null;
  let selectedColor = null;
  let currentQuantity = 1;
  let maxStock = 0;

  // DOM Elements
  const breadcrumbTitle = document.getElementById('detail-breadcrumb-title');
  const mainImg = document.getElementById('detail-main-img');
  const thumbRow = document.getElementById('detail-thumb-row');
  const nameEl = document.getElementById('detail-name');
  const brandEl = document.getElementById('detail-brand');
  const categoryEl = document.getElementById('detail-category');
  const priceEl = document.getElementById('detail-price');
  const descEl = document.getElementById('detail-description');
  const colorContainer = document.getElementById('color-pill-container');
  const sizeContainer = document.getElementById('size-pill-container');
  const selectedColorLabel = document.getElementById('selected-color-label');
  const selectedSizeLabel = document.getElementById('selected-size-label');
  const stockFeedback = document.getElementById('stock-feedback');
  const stockStatus = document.getElementById('detail-stock-status');
  const qtyInput = document.getElementById('qty-input');
  const btnQtyMinus = document.getElementById('btn-qty-minus');
  const btnQtyPlus = document.getElementById('btn-qty-plus');
  const btnAddCart = document.getElementById('btn-add-cart');
  const btnBuyNow = document.getElementById('btn-buy-now');
  const btnToggleWishlist = document.getElementById('btn-toggle-wishlist');
  const wishlistIcon = document.getElementById('wishlist-btn-icon');
  const reviewForm = document.getElementById('review-form');

  // 1. Tải chi tiết sản phẩm
  await fetchProductDetail();

  // 2. Tải đánh giá
  await fetchReviews();

  // Quantity Handlers
  btnQtyMinus.onclick = () => {
    if (currentQuantity > 1) {
      currentQuantity--;
      qtyInput.value = currentQuantity;
    }
  };

  btnQtyPlus.onclick = () => {
    if (currentQuantity < maxStock) {
      currentQuantity++;
      qtyInput.value = currentQuantity;
    } else {
      window.toast.warning(`Chỉ còn tối đa ${maxStock} đôi trong kho.`);
    }
  };

  // Wishlist handler
  if (btnToggleWishlist) {
    btnToggleWishlist.onclick = () => {
      if (product) {
        const added = window.api.wishlist.toggle(product);
        wishlistIcon.textContent = added ? 'Đã lưu' : 'Lưu vào yêu thích';
        window.toast.success(added ? 'Đã thêm vào danh sách yêu thích' : 'Đã xóa khỏi yêu thích');
      }
    };
  }

  // Add to cart handler
  if (btnAddCart) {
    btnAddCart.onclick = async () => {
      await handleAddToCart(false);
    };
  }

  // Buy now handler
  if (btnBuyNow) {
    btnBuyNow.onclick = async () => {
      await handleAddToCart(true);
    };
  }

  // Review Form handler
  if (reviewForm) {
    reviewForm.onsubmit = async (e) => {
      e.preventDefault();

      if (!window.api.isLoggedIn()) {
        window.toast.warning('Vui lòng đăng nhập để gửi đánh giá sản phẩm.');
        setTimeout(() => {
          window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.href)}`;
        }, 800);
        return;
      }

      const rating = document.getElementById('review-rating-select').value;
      const comment = document.getElementById('review-comment-input').value.trim();

      try {
        const res = await window.api.post(`/products/${productId}/reviews`, {
          rating: Number(rating),
          comment
        });

        if (res.success) {
          window.toast.success('Gửi đánh giá thành công! Cảm ơn nhận xét của bạn.');
          document.getElementById('review-comment-input').value = '';
          await fetchReviews();
        }
      } catch (err) {
        window.toast.error(err.message || 'Chỉ khách hàng đã mua sản phẩm này mới được đánh giá.');
      }
    };
  }

  /**
   * Tải dữ liệu sản phẩm từ API
   */
  async function fetchProductDetail() {
    try {
      const res = await window.api.get(`/products/${productId}`);
      if (res.success && res.data) {
        product = res.data;
        document.title = `${product.name} - SportZone`;

        breadcrumbTitle.textContent = product.name;
        nameEl.textContent = product.name;
        brandEl.textContent = product.brand ? product.brand.name : 'SPORT';
        categoryEl.textContent = product.category ? product.category.name : 'GIÀY';
        priceEl.textContent = window.api.formatCurrency(product.salePrice);
        descEl.textContent = product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.';

        // Image Gallery
        const images = product.images && product.images.length > 0
          ? product.images
          : ['/images/shoes/1.jpg'];

        mainImg.src = images[0];
        thumbRow.innerHTML = images.map((imgUrl, idx) => `
          <div class="thumb-item ${idx === 0 ? 'active' : ''}" onclick="switchImage('${imgUrl}', this)">
            <img src="${imgUrl}" alt="thumb">
          </div>
        `).join('');

        // Wishlist Status
        if (window.api.wishlist.has(product._id)) {
          wishlistIcon.textContent = 'Đã lưu';
        }

        // Render Colors
        const colors = product.colors && product.colors.length > 0
          ? product.colors
          : (product.variants ? Array.from(new Set(product.variants.map((v) => v.color))) : ['Default']);

        colorContainer.innerHTML = colors.map((c) => `
          <button type="button" class="option-pill" data-color="${c}">${c}</button>
        `).join('');

        colorContainer.querySelectorAll('.option-pill').forEach((btn) => {
          btn.onclick = () => {
            colorContainer.querySelectorAll('.option-pill').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            selectedColor = btn.dataset.color;
            selectedColorLabel.textContent = selectedColor;
            updateVariantAvailability();
          };
        });

        // Render Sizes
        const sizes = product.sizes && product.sizes.length > 0
          ? product.sizes
          : (product.variants ? Array.from(new Set(product.variants.map((v) => Number(v.size)))) : [40]);

        sizeContainer.innerHTML = sizes.sort((a, b) => a - b).map((s) => `
          <button type="button" class="option-pill" data-size="${s}">${s}</button>
        `).join('');

        sizeContainer.querySelectorAll('.option-pill').forEach((btn) => {
          btn.onclick = () => {
            sizeContainer.querySelectorAll('.option-pill').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            selectedSize = Number(btn.dataset.size);
            selectedSizeLabel.textContent = `Size ${selectedSize}`;
            updateVariantAvailability();
          };
        });

        // Tự động chọn màu đầu tiên và size đầu tiên nếu có
        if (colors.length > 0) {
          const firstColorBtn = colorContainer.querySelector('.option-pill');
          if (firstColorBtn) firstColorBtn.click();
        }
        if (sizes.length > 0) {
          const firstSizeBtn = sizeContainer.querySelector('.option-pill');
          if (firstSizeBtn) firstSizeBtn.click();
        }

        // Tải sản phẩm liên quan
        if (product.category) {
          loadRelatedProducts(product.category._id || product.category);
        }
      }
    } catch (err) {
      window.toast.error('Không tìm thấy thông tin sản phẩm.');
    }
  }

  window.switchImage = (imgUrl, thumbEl) => {
    mainImg.src = imgUrl;
    document.querySelectorAll('.thumb-item').forEach((t) => t.classList.remove('active'));
    thumbEl.classList.add('active');
  };

  /**
   * Cập nhật thông tin tồn kho khi chọn Size & Màu
   */
  function updateVariantAvailability() {
    if (!product || !selectedSize || !selectedColor) {
      btnAddCart.disabled = true;
      btnBuyNow.disabled = true;
      stockFeedback.textContent = 'Vui lòng chọn size và màu sắc';
      return;
    }

    let foundStock = 0;

    // Tìm trong variants
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(
        (v) =>
          Number(v.size) === selectedSize &&
          v.color.toLowerCase() === selectedColor.toLowerCase()
      );
      if (variant) {
        foundStock = variant.stockQuantity || 0;
      }
    } else {
      foundStock = product.stock || 0;
    }

    maxStock = foundStock;
    currentQuantity = 1;
    qtyInput.value = currentQuantity;

    if (maxStock > 0) {
      stockFeedback.innerHTML = `<span style="color: var(--color-success); font-weight: 700;">Còn ${maxStock} đôi</span> sẵn sàng giao ngay`;
      stockStatus.innerHTML = `<span class="badge badge-in-stock">Còn hàng (${maxStock})</span>`;
      btnAddCart.disabled = false;
      btnBuyNow.disabled = false;
    } else {
      stockFeedback.innerHTML = `<span style="color: var(--color-danger); font-weight: 700;">Tạm hết hàng</span> cho mẫu size này`;
      stockStatus.innerHTML = `<span class="badge badge-out-of-stock">Hết hàng</span>`;
      btnAddCart.disabled = true;
      btnBuyNow.disabled = true;
    }
  }

  /**
   * Thêm sản phẩm vào giỏ hàng
   */
  async function handleAddToCart(isBuyNow = false) {
    if (!window.api.isLoggedIn()) {
      window.toast.warning('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
      setTimeout(() => {
        window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.href)}`;
      }, 700);
      return;
    }

    if (!selectedSize || !selectedColor) {
      window.toast.warning('Vui lòng chọn đầy đủ kích thước (Size) và màu sắc.');
      return;
    }

    try {
      btnAddCart.disabled = true;
      const res = await window.api.post('/cart/items', {
        productId: product._id,
        size: selectedSize,
        color: selectedColor,
        quantity: currentQuantity
      });

      if (res.success) {
        window.toast.success(`Đã thêm ${currentQuantity} đôi "${product.name}" vào giỏ hàng!`);
        window.dispatchEvent(new Event('cartChange'));

        if (isBuyNow) {
          window.location.href = '/checkout.html';
        }
      }
    } catch (err) {
      window.toast.error(err.message || 'Không thể thêm vào giỏ hàng.');
    } finally {
      btnAddCart.disabled = false;
    }
  }

  /**
   * Tải danh sách đánh giá
   */
  async function fetchReviews() {
    try {
      const res = await window.api.get(`/products/${productId}/reviews`);
      const container = document.getElementById('reviews-list-container');
      const scoreEl = document.getElementById('detail-rating-score');
      const countEl = document.getElementById('detail-review-count');

      if (res.success && res.data) {
        const { totalReviews, averageRating, reviews } = res.data;

        if (scoreEl) scoreEl.textContent = averageRating > 0 ? averageRating.toFixed(1) : '5.0';
        if (countEl) countEl.textContent = `(${totalReviews} đánh giá)`;

        if (totalReviews === 0) {
          container.innerHTML = `
            <div class="empty-state" style="padding: 30px;">
              <p style="color: var(--text-muted); margin-top: 8px;">Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên trải nghiệm!</p>
            </div>
          `;
          return;
        }

        container.innerHTML = reviews.map((r) => {
          const scoreBadge = `<span class="badge badge-in-stock">${r.rating}.0 / 5.0</span>`;
          const userName = r.user ? (r.user.fullName || r.user.name || 'Khách hàng') : 'Khách hàng';
          const dateStr = new Date(r.createdAt).toLocaleDateString('vi-VN');

          return `
            <div class="card" style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong>${userName}</strong>
                <span style="color: var(--text-dim); font-size: 0.82rem;">${dateStr}</span>
              </div>
              <div style="font-size: 0.88rem; margin-bottom: 8px;">Đánh giá: ${scoreBadge}</div>
              <p style="color: var(--text-muted); font-size: 0.92rem;">${r.comment || 'Khách hàng không để lại nhận xét chi tiết.'}</p>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('Lỗi tải đánh giá:', err);
    }
  }

  /**
   * Tải sản phẩm liên quan
   */
  async function loadRelatedProducts(catId) {
    try {
      const res = await window.api.get(`/products?category=${catId}&limit=4`);
      const relatedGrid = document.getElementById('related-products-grid');

      if (res.success && res.data && relatedGrid) {
        const filtered = res.data.filter((p) => p._id !== productId);
        if (filtered.length === 0) {
          relatedGrid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1;">Không có sản phẩm liên quan nào khác.</p>';
          return;
        }

        relatedGrid.innerHTML = filtered.map((p) => {
          const thumb = (p.images && p.images[0]) || '/images/shoes/1.jpg';
          return `
            <div class="product-card">
              <div class="product-card-thumb">
                <img src="${thumb}" alt="${p.name}" loading="lazy">
              </div>
              <div class="product-card-body">
                <h3 class="product-card-title">
                  <a href="/product-detail.html?id=${p._id}">${p.name}</a>
                </h3>
                <div class="product-card-price-row">
                  <span class="product-card-price">${window.api.formatCurrency(p.salePrice)}</span>
                </div>
                <a href="/product-detail.html?id=${p._id}" class="btn btn-secondary btn-sm btn-block">Xem chi tiết</a>
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (e) {
      console.error('Lỗi tải sản phẩm liên quan:', e);
    }
  }
});
