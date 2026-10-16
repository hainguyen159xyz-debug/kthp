/**
 * WISHLIST CONTROLLER (wishlist.html)
 * Sport Shoes E-Commerce & Inventory Management Platform
 */

document.addEventListener('DOMContentLoaded', () => {
  const gridEl = document.getElementById('wishlist-products-grid');
  const emptyState = document.getElementById('wishlist-empty-state');
  const countLabel = document.getElementById('wishlist-count-label');

  renderWishlist();

  window.addEventListener('wishlistChange', renderWishlist);

  function renderWishlist() {
    const list = window.api.wishlist.get();

    if (list.length === 0) {
      gridEl.innerHTML = '';
      emptyState.style.display = 'block';
      countLabel.textContent = '0 sản phẩm trong danh sách';
      return;
    }

    emptyState.style.display = 'none';
    countLabel.textContent = `${list.length} sản phẩm bạn đã lưu lại`;

    gridEl.innerHTML = list.map((p) => {
      const thumb = (p.images && p.images[0]) || '/images/shoes/1.jpg';
      const brandName = p.brand ? (p.brand.name || 'SPORT') : 'SPORT';

      return `
        <div class="product-card">
          <div class="product-card-thumb">
            <img src="${thumb}" alt="${p.name}" loading="lazy" onerror="this.src='/images/shoes/1.jpg'">
            <button class="product-card-wishlist-btn active" onclick="removeFromWishlist('${p._id}')" title="Xóa khỏi yêu thích" aria-label="Xóa">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
          <div class="product-card-body">
            <div class="product-card-meta">
              <span class="product-card-brand">${brandName}</span>
              <span class="product-card-rating">5.0 / 5</span>
            </div>
            <h3 class="product-card-title">
              <a href="/product-detail.html?id=${p._id}">${p.name}</a>
            </h3>
            <div class="product-card-price-row">
              <span class="product-card-price">${window.api.formatCurrency(p.salePrice)}</span>
            </div>
            <div class="product-card-actions">
              <a href="/product-detail.html?id=${p._id}" class="btn btn-secondary btn-sm">Chi tiết</a>
              <a href="/product-detail.html?id=${p._id}" class="btn btn-primary btn-sm">Mua hàng</a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.removeFromWishlist = (productId) => {
    window.api.wishlist.remove(productId);
    window.toast.success('Đã xóa sản phẩm khỏi danh sách yêu thích.');
    renderWishlist();
  };
});
