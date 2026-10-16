/**
 * PRODUCT DETAIL CONTROLLER (product-detail.html)
 * Sport Shoes E-Commerce & Inventory Management Platform
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  let productId = urlParams.get('id');

  if (!productId) {
    try {
      const pListRes = await window.api.get('/products?limit=1');
      if (pListRes.success && pListRes.data && pListRes.data.length > 0) {
        productId = pListRes.data[0]._id;
        window.history.replaceState({}, '', `/product-detail.html?id=${productId}`);
      } else {
        window.location.href = '/products.html';
        return;
      }
    } catch (e) {
      window.location.href = '/products.html';
      return;
    }
  }

  let product = null;
  let selectedSize = null;
  let selectedColor = null;
  let currentQuantity = 1;
  let maxStock = 0;

  // Trạng thái danh sách đánh giá (khai báo sớm để dùng được ngay khi tải trang)
  let currentReviewsList = [];
  let currentSortOption = 'newest';
  let currentRatingFilter = 'all';
  const likedReviewsSet = new Set();

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
  const wishlistSvg = document.getElementById('detail-wishlist-svg');
  const wishlistBtnText = document.getElementById('wishlist-btn-text');

  // Helper cập nhật trạng thái hiển thị nút yêu thích chuẩn xác
  function updateWishlistUI(added) {
    if (btnToggleWishlist) {
      btnToggleWishlist.classList.toggle('active', added);
      btnToggleWishlist.setAttribute('title', added ? 'Bỏ khỏi yêu thích' : 'Lưu vào danh sách yêu thích');
    }
    if (wishlistSvg) {
      wishlistSvg.setAttribute('fill', added ? '#E11D48' : 'none');
      wishlistSvg.setAttribute('stroke', added ? '#E11D48' : 'currentColor');
    }
    if (wishlistBtnText) {
      wishlistBtnText.textContent = added ? 'Đã thích' : 'Yêu thích';
    }
  }

  // 1 & 2. Tải chi tiết sản phẩm và danh sách đánh giá
  try {
    await fetchProductDetail();
  } catch (err) {
    console.error('Lỗi tải sản phẩm:', err);
  }

  try {
    await fetchReviews();
  } catch (err) {
    console.error('Lỗi tải đánh giá:', err);
  }

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
        updateWishlistUI(added);
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
        if (thumbRow) thumbRow.innerHTML = '';

        // Wishlist Status
        updateWishlistUI(window.api.wishlist.has(product._id));

        // Render Colors as Thumbnail Buttons
        let colorList = [];
        if (product.colorVariants && product.colorVariants.length > 0) {
          colorList = product.colorVariants;
        } else if (product.colors && product.colors.length > 0) {
          const mainImgUrl = (product.images && product.images[0]) || '/images/shoes/1.jpg';
          colorList = product.colors.map((c, idx) => ({
            color: c,
            image: (product.images && product.images[idx]) || mainImgUrl
          }));
        } else if (product.variants && product.variants.length > 0) {
          const uniqueColors = Array.from(new Set(product.variants.map((v) => v.color)));
          colorList = uniqueColors.map((c) => {
            const vMatch = product.variants.find((v) => v.color === c);
            return {
              color: c,
              image: (vMatch && vMatch.image) || (product.images && product.images[0]) || '/images/shoes/1.jpg'
            };
          });
        } else {
          colorList = [{ color: 'Tiêu chuẩn', image: (product.images && product.images[0]) || '/images/shoes/1.jpg' }];
        }

        colorContainer.innerHTML = colorList.map((cv) => `
          <button type="button" 
                  class="color-thumb-btn" 
                  data-color="${cv.color}" 
                  data-image="${cv.image}" 
                  title="Chọn màu: ${cv.color}" 
                  aria-label="Chọn màu ${cv.color}">
            <img src="${cv.image}" alt="${product.name} - ${cv.color}" onerror="this.src='/images/shoes/1.jpg'">
          </button>
        `).join('');

        colorContainer.querySelectorAll('.color-thumb-btn').forEach((btn) => {
          btn.onclick = () => {
            colorContainer.querySelectorAll('.color-thumb-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            selectedColor = btn.dataset.color;
            if (selectedColorLabel) selectedColorLabel.textContent = '';

            // Chuyển ảnh chính sang ảnh tương ứng với màu đã chọn kèm hiệu ứng mượt mà
            const colorImg = btn.dataset.image;
            if (colorImg && mainImg) {
              if (mainImg.getAttribute('src') !== colorImg) {
                mainImg.classList.add('fade-transition');
                setTimeout(() => {
                  mainImg.src = colorImg;
                  mainImg.onload = () => mainImg.classList.remove('fade-transition');
                  setTimeout(() => mainImg.classList.remove('fade-transition'), 160);
                }, 100);
              }

              // Đồng bộ highlight ảnh trong hàng thumbnail bộ sưu tập
              document.querySelectorAll('.thumb-item').forEach((t) => {
                const tImg = t.querySelector('img');
                if (tImg && tImg.getAttribute('src') === colorImg) {
                  t.classList.add('active');
                } else {
                  t.classList.remove('active');
                }
              });
            }

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
            if (selectedSizeLabel) selectedSizeLabel.textContent = '';
            updateVariantAvailability();
          };
        });

        // Tự động chọn màu đầu tiên và size đầu tiên nếu có
        if (colorList.length > 0) {
          const firstColorBtn = colorContainer.querySelector('.color-thumb-btn');
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

        // Render Mô Tả Sản Phẩm & Thông Tin Chi Tiết
        renderProductOverview(product);
      }
    } catch (err) {
      window.toast.error('Không tìm thấy thông tin sản phẩm.');
    }
  }

  window.switchImage = (imgUrl, thumbEl) => {
    if (mainImg && mainImg.getAttribute('src') !== imgUrl) {
      mainImg.classList.add('fade-transition');
      setTimeout(() => {
        mainImg.src = imgUrl;
        mainImg.onload = () => mainImg.classList.remove('fade-transition');
        setTimeout(() => mainImg.classList.remove('fade-transition'), 160);
      }, 100);
    }
    document.querySelectorAll('.thumb-item').forEach((t) => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');

    // Nếu ảnh trong thư viện khớp với một phiên bản màu, đồng bộ chọn màu đó
    if (colorContainer) {
      const matchingColorBtn = colorContainer.querySelector(`.color-thumb-btn[data-image="${imgUrl}"]`);
      if (matchingColorBtn && !matchingColorBtn.classList.contains('active')) {
        matchingColorBtn.click();
      }
    }
  };

  /**
   * Cập nhật thông tin tồn kho khi chọn Size & Màu
   */
  function updateVariantAvailability() {
    if (!product || !selectedSize || !selectedColor) {
      btnAddCart.disabled = true;
      btnBuyNow.disabled = true;
      if (stockFeedback) stockFeedback.textContent = '';
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
      if (stockFeedback) stockFeedback.innerHTML = '';
      if (stockStatus) stockStatus.innerHTML = '';
      btnAddCart.disabled = false;
      btnBuyNow.disabled = false;
    } else {
      if (stockFeedback) stockFeedback.innerHTML = '<span style="color: var(--color-danger); font-size: 0.85rem; font-weight: 600;">Tạm hết hàng</span>';
      if (stockStatus) stockStatus.innerHTML = '<span class="badge badge-out-of-stock">Hết hàng</span>';
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
      let combined = [];
      try {
        const res = await window.api.get(`/products/${productId}/reviews`);
        if (res.success && res.data && res.data.reviews && res.data.reviews.length > 0) {
          const avatarColors = ['#1E293B', '#0F766E', '#334155', '#B45309', '#047857', '#4338CA', '#DB2777', '#374151'];
          const apiReviews = res.data.reviews.map((r, idx) => {
            const uName = r.user ? (r.user.fullName || r.user.name || 'Khách hàng SportZone') : 'Khách hàng SportZone';
            const initials = uName.split(' ').map(w => w[0]).join('').slice(-2).toUpperCase() || 'KH';
            return {
              id: r._id || `api-${idx}`,
              userName: uName,
              userInitials: initials,
              avatarBg: avatarColors[idx % avatarColors.length],
              rating: Number(r.rating) || 5,
              date: r.createdAt || new Date().toISOString(),
              variant: r.variant || '',
              title: r.title || '',
              comment: r.comment || '',
              tags: Array.isArray(r.tags) ? r.tags : [],
              helpful: Number(r.helpful) || 0,
              shopReply: r.shopReply || ''
            };
          });
          combined = [...apiReviews];
        }
      } catch (e) {
        console.warn('Không tải được đánh giá:', e.message);
      }

      currentReviewsList = combined;

      // Cập nhật tổng số lượng và điểm trung bình
      const totalCount = currentReviewsList.length;
      let sumRating = 0;
      currentReviewsList.forEach((r) => {
        sumRating += Number(r.rating) || 5;
      });
      const avgScore = totalCount > 0 ? (sumRating / totalCount).toFixed(1) : '5.0';
      const count5 = currentReviewsList.filter(r => Math.round(Number(r.rating)) === 5).length;
      const count4 = currentReviewsList.filter(r => Math.round(Number(r.rating)) === 4).length;
      const count3 = currentReviewsList.filter(r => Math.round(Number(r.rating)) <= 3).length;
      const chip3El = document.getElementById('reviews-chip-3star');
      if (chip3El) chip3El.textContent = count3;

      const scoreEl = document.getElementById('detail-rating-score');
      const countEl = document.getElementById('detail-review-count');
      const accCountEl = document.getElementById('acc-review-count');
      const chipTotalEl = document.getElementById('reviews-chip-total');
      const chip5El = document.getElementById('reviews-chip-5star');
      const chip4El = document.getElementById('reviews-chip-4star');
      const headerStarsEl = document.getElementById('detail-header-stars');
      const accStarsEl = document.getElementById('acc-header-stars');

      const numericScore = parseFloat(avgScore) || 5;
      const clampedStars = Math.max(1, Math.min(5, Math.round(numericScore)));
      const starsDisplay = '★'.repeat(clampedStars) + '☆'.repeat(5 - clampedStars);

      if (scoreEl) scoreEl.textContent = avgScore;
      if (countEl) countEl.textContent = `(${totalCount} đánh giá)`;
      if (accCountEl) accCountEl.textContent = `(${totalCount})`;
      if (chipTotalEl) chipTotalEl.textContent = totalCount;
      if (chip5El) chip5El.textContent = count5;
      if (chip4El) chip4El.textContent = count4;
      if (headerStarsEl) headerStarsEl.textContent = starsDisplay;
      if (accStarsEl) accStarsEl.textContent = starsDisplay;

      // Render danh sách theo thứ tự mặc định
      renderReviewsList();
    } catch (err) {
      console.error('Lỗi tải đánh giá:', err);
    }
  }

  /**
   * Render danh sách đánh giá kèm bộ lọc sắp xếp và sao
   */
  function renderReviewsList() {
    const container = document.getElementById('reviews-list-container');
    if (!container) return;

    // 1. Lọc theo số sao
    let filtered = [...currentReviewsList];
    if (currentRatingFilter !== 'all') {
      const targetRating = parseInt(currentRatingFilter, 10);
      filtered = filtered.filter(r => (targetRating <= 3 ? r.rating <= 3 : r.rating === targetRating));
    }

    // 2. Sắp xếp
    if (currentSortOption === 'newest') {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (currentSortOption === 'oldest') {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (currentSortOption === 'helpful') {
      filtered.sort((a, b) => (b.helpful || 0) - (a.helpful || 0) || new Date(b.date) - new Date(a.date));
    } else if (currentSortOption === 'highest') {
      filtered.sort((a, b) => b.rating - a.rating || new Date(b.date) - new Date(a.date));
    } else if (currentSortOption === 'lowest') {
      filtered.sort((a, b) => a.rating - b.rating || new Date(b.date) - new Date(a.date));
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #64748B;">
          <p style="margin: 0; font-size: 0.95rem;">${currentReviewsList.length === 0 ? 'Sản phẩm này chưa có đánh giá nào.' : 'Không có nhận xét nào phù hợp với bộ lọc đã chọn.'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((r) => {
      const safeRating = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
      const starsStr = '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating);
      const dateFormatted = r.date ? new Date(r.date).toLocaleDateString('vi-VN') : 'Gần đây';
      const tagsHtml = (r.tags || []).map((t) => `<span class="review-tag">${t}</span>`).join('');
      const isLiked = likedReviewsSet.has(r.id);
      const displayLikes = (Number(r.helpful) || 0) + (isLiked ? 1 : 0);

      const replyHtml = r.shopReply ? `
        <div class="review-shop-reply">
          <div class="review-shop-reply-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Phản hồi từ SportZone Store
          </div>
          <p class="review-shop-reply-text">${r.shopReply}</p>
        </div>
      ` : '';

      return `
        <div class="review-item-card" id="card-${r.id}">
          <div class="review-card-top">
            <div class="reviewer-profile">
              <div class="reviewer-avatar" style="background-color: ${r.avatarBg || '#1E293B'};">
                ${r.userInitials || 'KH'}
              </div>
              <div class="reviewer-details">
                <div class="reviewer-name-row">
                  <span class="reviewer-name">${r.userName}</span>
                </div>
                ${r.variant ? `<span class="review-order-variant">${r.variant}</span>` : ''}
              </div>
            </div>

            <div class="review-rating-col">
              <span class="review-stars" style="color: #F59E0B; letter-spacing: 2px;">${starsStr}</span>
              <span class="review-date">${dateFormatted}</span>
            </div>
          </div>

          ${r.title ? `<h4 class="review-title">${r.title}</h4>` : ''}
          <p class="review-comment">${r.comment}</p>

          ${tagsHtml ? `<div class="review-tags-row">
            ${tagsHtml}
          </div>` : ''}

          ${replyHtml}

          <div class="review-card-footer">
            <span class="review-purchase-confirm">Chứng nhận đơn hàng thực tế bởi SportZone</span>
            <button type="button" class="btn-helpful ${isLiked ? 'liked' : ''}" onclick="toggleHelpfulReview('${r.id}', this)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
              <span>Hữu ích (${displayLikes})</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Global handler cho dropdown sắp xếp
  window.handleSortReviews = function(sortValue) {
    currentSortOption = sortValue;
    renderReviewsList();
  };

  // Global handler cho bộ lọc số sao (Chips)
  window.filterReviewsByRating = function(ratingStr, btnEl) {
    currentRatingFilter = ratingStr;
    const chips = document.querySelectorAll('.review-chip');
    chips.forEach(c => c.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    renderReviewsList();
  };

  // Global handler cho nút thích / hữu ích
  window.toggleHelpfulReview = function(reviewId, btnEl) {
    if (likedReviewsSet.has(reviewId)) {
      likedReviewsSet.delete(reviewId);
    } else {
      likedReviewsSet.add(reviewId);
      if (window.toast && window.toast.success) {
        window.toast.success('Cảm ơn bạn đã phản hồi đánh giá hữu ích!');
      }
    }
    renderReviewsList();
  };

  // Cuộn trang mượt mà tới phần Đánh giá & mở accordion
  window.scrollToReviews = function() {
    const accReviews = document.getElementById('acc-item-reviews');
    if (accReviews) {
      if (!accReviews.classList.contains('open')) {
        accReviews.classList.add('open');
      }
      accReviews.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

  /**
   * Toggle Accordion Items (Đánh giá, Mô tả, Thông tin chi tiết)
   */
  window.toggleProductAccordion = function(itemId) {
    const item = document.getElementById(itemId);
    if (item) {
      item.classList.toggle('open');
    }
  };

  /**
   * Render Nội Dung Accordion Mô Tả & Thông Tin Chi Tiết (Khớp chuẩn 100% ảnh tham chiếu)
   */
  function renderProductOverview(p) {
    const fullDescEl = document.getElementById('acc-full-description');
    const descImgEl = document.getElementById('acc-desc-img');
    const specsContainer = document.getElementById('acc-specs-container');

    const brandName = p.brand ? (p.brand.name || 'Adidas') : 'Adidas';
    const catName = p.category ? (p.category.name || 'giày thể thao') : 'giày thể thao';

    // Xác định công nghệ đệm phù hợp từng hãng/mẫu giày
    let midsoleTech = 'LIGHTSTRIKEPRO';
    const nameUpper = (p.name || '').toUpperCase();
    const brandUpper = (p.brand && p.brand.name ? p.brand.name : '').toUpperCase();
    if (brandUpper.includes('NIKE') || nameUpper.includes('NIKE') || nameUpper.includes('PEGASUS') || nameUpper.includes('ZOOM')) {
      midsoleTech = 'ZOOM AIR & REACTX';
    } else if (brandUpper.includes('PUMA') || nameUpper.includes('NITRO')) {
      midsoleTech = 'NITRO FOAM';
    } else if (brandUpper.includes('ADIDAS') || nameUpper.includes('BOOST') || nameUpper.includes('DAME')) {
      midsoleTech = 'LIGHTSTRIKEPRO';
    }

    // 1. Render Ảnh minh họa bên phải trong Accordion 'Mô tả'
    if (descImgEl) {
      descImgEl.src = (p.images && p.images[0]) || '/images/shoes/1.jpg';
      descImgEl.alt = p.name;
    }

    // 2. Render 3 đoạn văn trong Accordion 'Mô tả' (Khớp văn phong chính hãng trong ảnh)
    if (fullDescEl) {
      fullDescEl.innerHTML = `
        <p>Khi nói đến việc phá vỡ giới hạn, đôi giày sneaker siêu nhẹ này được thiết kế để giúp bạn luôn dẫn đầu. Được kỹ thuật mang lại trải nghiệm chạy linh hoạt, đôi giày này vừa chú trọng hiệu suất vừa đảm bảo sự thoải mái.</p>
        <p>Càng nhẹ càng nhanh. Công nghệ đệm ${midsoleTech} siêu nhẹ từ ${brandName} mang lại cảm giác êm ái cùng độ hoàn trả năng lượng, giúp bạn đạt tốc độ vượt trội. Chủ đề này tiếp tục được thể hiện qua thiết kế lấy cảm hứng từ tốc độ và đường đua, khẳng định phong cách đặc trưng.</p>
        <p>Với thân giày bằng vải dệt và dây giày, bạn có thể điều chỉnh độ vừa vặn để tăng sự ổn định và thoải mái, trong khi đế ngoài cao su điêu khắc mang lại độ bám, phong cách và tự tin. Dù chạy hàng ngày, đi dạo hay trong những ngày thi đấu, đôi giày này luôn giúp bạn trông và cảm thấy tuyệt vời nhất.</p>
      `;
    }

    // 3. Render 2 cột gạch đầu dòng trong Accordion 'Thông tin chi tiết' (Khớp chuẩn ảnh mẫu)
    if (specsContainer) {
      const colorNames = p.colorVariants && p.colorVariants.length > 0
        ? p.colorVariants.map(c => c.color).join(' / ')
        : (p.colors && p.colors.length > 0 ? p.colors.join(' / ') : 'Core Black / Cloud White / Iron Metallic');

      const skuCode = (p.variants && p.variants[0] && p.variants[0].sku) 
        || ('KI' + (p._id ? p._id.slice(-4).toUpperCase() : '4764'));

      specsContainer.innerHTML = `
        <div>
          <li>Kiểu dáng tiêu chuẩn</li>
          <li>Dây giày</li>
          <li>Thân giày bằng vải dệt</li>
          <li>Lót giày bằng vải dệt</li>
        </div>
        <div>
          <li>Đế giữa ${midsoleTech}</li>
          <li>Đế ngoài bằng cao su</li>
          <li>Màu sản phẩm: ${colorNames}</li>
          <li>Mã sản phẩm: ${skuCode}</li>
        </div>
      `;
    }
  }
});
