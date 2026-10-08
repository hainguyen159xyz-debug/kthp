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
            <img src="${thumb}" alt="${p.name}" loading="lazy">
            <button class="product-card-wishlist-btn active" onclick="removeFromWishlist('${p._id}')" title="Xóa khỏi yêu thích">
              Xóa
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
              <a href="/product-detail.html?id=${p._id}" class="btn btn-primary btn-sm btn-block">
                Xem & Chọn Mua
              </a>
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
