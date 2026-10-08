/**
 * PRODUCT CATALOG CONTROLLER (products.html)
 * Sport Shoes E-Commerce & Inventory Management Platform
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);

  // State
  const state = {
    page: Number(urlParams.get('page')) || 1,
    limit: 12,
    search: urlParams.get('search') || '',
    category: urlParams.get('category') || '',
    brand: urlParams.get('brand') || '',
    size: urlParams.get('size') || '',
    color: urlParams.get('color') || '',
    minPrice: urlParams.get('minPrice') || '',
    maxPrice: urlParams.get('maxPrice') || '',
    featured: urlParams.get('featured') || '',
    isFastMoving: urlParams.get('isFastMoving') || '',
    sortBy: 'createdAt',
    order: 'desc'
  };

  // Elements
  const gridEl = document.getElementById('catalog-products-grid');
  const countLabel = document.getElementById('catalog-count-label');
  const emptyState = document.getElementById('catalog-empty-state');
  const paginationEl = document.getElementById('catalog-pagination');
  const sortSelect = document.getElementById('sort-select');
  const btnReset = document.getElementById('btn-reset-filters');
  const btnEmptyReset = document.getElementById('btn-empty-reset');
  const minPriceInput = document.getElementById('filter-min-price');
  const maxPriceInput = document.getElementById('filter-max-price');
  const btnApplyPrice = document.getElementById('btn-apply-price');
  const mobileFilterBtn = document.getElementById('btn-mobile-filter');
  const filterSidebar = document.getElementById('catalog-filter-sidebar');

  if (state.minPrice) minPriceInput.value = state.minPrice;
  if (state.maxPrice) maxPriceInput.value = state.maxPrice;

  // 1. Tải danh mục và thương hiệu cho Sidebar
  await loadFilterSidebar();

  // 2. Tải danh sách sản phẩm
  await fetchProducts();

  // Sort change handler
  if (sortSelect) {
    sortSelect.onchange = (e) => {
      const [sb, ord] = e.target.value.split('-');
      state.sortBy = sb;
      state.order = ord;
      state.page = 1;
      fetchProducts();
    };
  }

  // Filter Reset handlers
  const handleReset = () => {
    state.category = '';
    state.brand = '';
    state.size = '';
    state.color = '';
    state.minPrice = '';
    state.maxPrice = '';
    state.search = '';
    state.featured = '';
    state.isFastMoving = '';
    state.page = 1;

    minPriceInput.value = '';
    maxPriceInput.value = '';

    // Reset radio buttons
    document.querySelectorAll('#filter-categories-list input').forEach((r) => (r.checked = r.value === ''));
    document.querySelectorAll('#filter-brands-list input').forEach((r) => (r.checked = r.value === ''));
    document.querySelectorAll('#filter-colors-list input').forEach((r) => (r.checked = r.value === ''));
    document.querySelectorAll('#filter-sizes-group button').forEach((b) => b.classList.remove('active'));

    history.pushState(null, '', '/products.html');
    fetchProducts();
  };

  if (btnReset) btnReset.onclick = handleReset;
  if (btnEmptyReset) btnEmptyReset.onclick = handleReset;

  // Apply price filter
  if (btnApplyPrice) {
    btnApplyPrice.onclick = () => {
      state.minPrice = minPriceInput.value.trim();
      state.maxPrice = maxPriceInput.value.trim();
      state.page = 1;
      fetchProducts();
    };
  }

  // Mobile filter toggle
  if (mobileFilterBtn && filterSidebar) {
    mobileFilterBtn.onclick = () => {
      filterSidebar.classList.toggle('open-mobile');
    };
  }

  // Size pills click handler
  document.querySelectorAll('#filter-sizes-group button').forEach((btn) => {
    btn.onclick = () => {
      const sizeVal = btn.dataset.size;
      if (state.size === sizeVal) {
        state.size = '';
        btn.classList.remove('active');
      } else {
        document.querySelectorAll('#filter-sizes-group button').forEach((b) => b.classList.remove('active'));
        state.size = sizeVal;
        btn.classList.add('active');
      }
      state.page = 1;
      fetchProducts();
    };
  });

  /**
   * Gọi API tải danh mục và thương hiệu
   */
  async function loadFilterSidebar() {
    try {
      const [catsRes, brandsRes] = await Promise.all([
        window.api.get('/categories'),
        window.api.get('/brands')
      ]);

      // Render Categories
      const catList = document.getElementById('filter-categories-list');
      if (catsRes.success && catList) {
        catList.innerHTML = `
          <label class="filter-item">
            <input type="radio" name="category" value="" ${!state.category ? 'checked' : ''}>
            <span>Tất cả danh mục</span>
          </label>
        ` + catsRes.data.map((cat) => `
          <label class="filter-item">
            <input type="radio" name="category" value="${cat._id}" ${state.category === cat._id ? 'checked' : ''}>
            <span>${cat.name}</span>
          </label>
        `).join('');

        catList.querySelectorAll('input').forEach((input) => {
          input.onchange = (e) => {
            state.category = e.target.value;
            state.page = 1;
            fetchProducts();
          };
        });
      }

      // Render Brands
      const brandList = document.getElementById('filter-brands-list');
      if (brandsRes.success && brandList) {
        brandList.innerHTML = `
          <label class="filter-item">
            <input type="radio" name="brand" value="" ${!state.brand ? 'checked' : ''}>
            <span>Tất cả thương hiệu</span>
          </label>
        ` + brandsRes.data.map((b) => `
          <label class="filter-item">
            <input type="radio" name="brand" value="${b._id}" ${state.brand === b._id ? 'checked' : ''}>
            <span>${b.name}</span>
          </label>
        `).join('');

        brandList.querySelectorAll('input').forEach((input) => {
          input.onchange = (e) => {
            state.brand = e.target.value;
            state.page = 1;
            fetchProducts();
          };
        });
      }

      // Colors filter
      document.querySelectorAll('#filter-colors-list input').forEach((input) => {
        input.onchange = (e) => {
          state.color = e.target.value;
          state.page = 1;
          fetchProducts();
        };
      });
    } catch (e) {
      console.error('Lỗi tải bộ lọc:', e);
    }
  }

  /**
   * Tải danh sách sản phẩm từ backend
   */
  async function fetchProducts() {
    showSkeletons();

    const query = new URLSearchParams();
    query.set('page', state.page);
    query.set('limit', state.limit);
    query.set('sortBy', state.sortBy);
    query.set('order', state.order);

    if (state.search) query.set('search', state.search);
    if (state.category) query.set('category', state.category);
    if (state.brand) query.set('brand', state.brand);
    if (state.size) query.set('size', state.size);
    if (state.color) query.set('color', state.color);
    if (state.minPrice) query.set('minPrice', state.minPrice);
    if (state.maxPrice) query.set('maxPrice', state.maxPrice);
    if (state.featured) query.set('featured', state.featured);
    if (state.isFastMoving) query.set('isFastMoving', state.isFastMoving);

    try {
      const res = await window.api.get(`/products?${query.toString()}`);

      if (res.success && res.data) {
        const { total, totalPages } = res.pagination || { total: res.data.length, totalPages: 1 };

        if (countLabel) {
          countLabel.textContent = `Hiển thị ${res.data.length} trên tổng số ${total} sản phẩm`;
        }

        if (res.data.length === 0) {
          gridEl.innerHTML = '';
          emptyState.style.display = 'block';
          paginationEl.innerHTML = '';
          return;
        }

        emptyState.style.display = 'none';
        renderProducts(res.data);
        renderPagination(totalPages);
      }
    } catch (error) {
      gridEl.innerHTML = '';
      emptyState.style.display = 'block';
      window.toast.error('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
    }
  }

  function showSkeletons() {
    gridEl.innerHTML = Array(6)
      .fill(0)
      .map(
        () => `
          <div class="product-card skeleton" style="height: 380px;"></div>
        `
      )
      .join('');
  }

  function renderProducts(products) {
    gridEl.innerHTML = products
      .map((p) => {
        const isFav = window.api.wishlist.has(p._id);
        const stockStatus =
          p.stock > 5
            ? '<span class="badge badge-in-stock">Còn hàng</span>'
            : p.stock > 0
            ? '<span class="badge badge-low-stock">Sắp hết</span>'
            : '<span class="badge badge-out-of-stock">Tạm hết</span>';

        const thumb = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600';
        const brandName = p.brand ? p.brand.name || 'SPORT' : 'SPORT';

        return `
          <div class="product-card">
            <div class="product-card-thumb">
              <img src="${thumb}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'">
              <div class="product-card-badge">${stockStatus}</div>
              <button class="product-card-wishlist-btn ${isFav ? 'active' : ''}" onclick="toggleWishlist('${p._id}', this)" title="Yêu thích">
                ${isFav ? 'Đã lưu' : 'Lưu'}
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
                <a href="/product-detail.html?id=${p._id}" class="btn btn-secondary btn-sm" style="flex: 1;">Chi tiết</a>
                <a href="/product-detail.html?id=${p._id}" class="btn btn-primary btn-sm" style="flex: 1;">Chọn mua</a>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    let html = `
      <button class="page-btn" ${state.page === 1 ? 'disabled' : ''} onclick="changePage(${state.page - 1})">
        Trước
      </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <button class="page-btn ${state.page === i ? 'active' : ''}" onclick="changePage(${i})">
          ${i}
        </button>
      `;
    }

    html += `
      <button class="page-btn" ${state.page === totalPages ? 'disabled' : ''} onclick="changePage(${state.page + 1})">
        Sau
      </button>
    `;

    paginationEl.innerHTML = html;
  }

  window.changePage = (newPage) => {
    state.page = newPage;
    window.scrollTo({ top: 100, behavior: 'smooth' });
    fetchProducts();
  };

  window.toggleWishlist = async (id, btn) => {
    try {
      const res = await window.api.get(`/products/${id}`);
      if (res.success && res.data) {
        const added = window.api.wishlist.toggle(res.data);
        btn.classList.toggle('active', added);
        btn.innerHTML = added ? 'Đã lưu' : 'Lưu';
        window.toast.success(added ? 'Đã thêm vào yêu thích' : 'Đã xóa khỏi yêu thích');
      }
    } catch (e) {
      window.toast.error('Lỗi cập nhật yêu thích');
    }
  };
});
