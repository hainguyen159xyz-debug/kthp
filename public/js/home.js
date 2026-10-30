document.addEventListener('DOMContentLoaded', async () => {
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const productMap = new Map();
  const renderCard = (product) => {
    productMap.set(product._id, product);
    const sizes = [...new Set((product.variants || []).filter(v => v.stockQuantity > 0).map(v => v.size))].sort((a, b) => a - b);
    const colors = new Set((product.colorVariants || []).map(v => v.color));
    if (!colors.size) (product.colors || []).forEach(color => colors.add(color));
    const available = product.variants?.length ? sizes.length > 0 : product.stock > 0;
    const href = `/product-detail.html?id=${encodeURIComponent(product._id)}`;
    return `<article class="product-card home-product">
      <div class="home-product-media">
        <a class="product-card-thumb" href="${href}" aria-label="Xem ${escape(product.name)}"><img src="${escape(product.images?.[0] || '/images/shoes/1.jpg')}" alt="${escape(product.name)}" loading="lazy" width="320" height="260"></a>
        <button type="button" class="product-card-wishlist-btn ${window.api.wishlist.has(product._id) ? 'active' : ''}" data-wishlist="${escape(product._id)}" aria-label="Lưu ${escape(product.name)} vào yêu thích" aria-pressed="${window.api.wishlist.has(product._id)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-9.6a5.5 5.5 0 0 0 0-7.8Z"/></svg></button>
      </div>
      <div class="product-card-body">
        <div class="home-product-meta"><span class="product-card-brand">${escape(product.brand?.name || 'SportZone')}</span><span>${available ? 'Còn hàng' : 'Tạm hết hàng'}</span></div>
        <h3 class="product-card-title"><a href="${href}">${escape(product.name)}</a></h3>
        <p class="home-product-options">${colors.size ? `${colors.size} màu` : 'Xem màu sắc'} · ${sizes.length ? `Size ${sizes[0]}${sizes.length > 1 ? `–${sizes.at(-1)}` : ''}` : 'Xem tùy chọn size'}</p>
        <div class="product-card-price-row"><span class="product-card-price">${window.api.formatCurrency(product.salePrice)}</span></div>
        <a href="${href}" class="btn btn-secondary home-select-size">${available ? 'Chọn size' : 'Xem sản phẩm'}<span aria-hidden="true">↗</span></a>
      </div>
    </article>`;
  };

  document.querySelector('main').addEventListener('click', event => {
    const button = event.target.closest('[data-wishlist]');
    if (!button) return;
    const product = productMap.get(button.dataset.wishlist);
    if (!product) return;
    const added = window.api.wishlist.toggle(product);
    document.querySelectorAll('[data-wishlist]').forEach(item => {
      if (item.dataset.wishlist !== product._id) return;
      item.classList.toggle('active', added);
      item.setAttribute('aria-pressed', String(added));
    });
    window.toast.success(added ? 'Đã lưu sản phẩm vào yêu thích.' : 'Đã bỏ sản phẩm khỏi yêu thích.');
  });

  const showLoadError = (element, retry = true) => {
    element.innerHTML = `<div class="home-empty"><p>Chưa thể tải nội dung. Vui lòng thử lại.</p>${retry ? '<button type="button" class="btn btn-secondary" data-reload>Tải lại</button>' : '<a class="btn btn-secondary" href="/products.html">Xem sản phẩm</a>'}</div>`;
    element.querySelector('[data-reload]')?.addEventListener('click', () => window.location.reload());
  };

  const loadProducts = async (endpoint, id) => {
    const element = document.getElementById(id);
    try {
      const result = await window.api.get(endpoint);
      if (!result.success || !Array.isArray(result.data)) throw new Error('Invalid response');
      element.innerHTML = result.data.length ? result.data.map(renderCard).join('') : '<p class="home-empty">Sản phẩm đang được cập nhật. <a href="/products.html">Khám phá danh mục giày</a></p>';
      return result.data;
    } catch (_) { showLoadError(element); return []; }
  };

  const loadCategories = async () => {
    const element = document.getElementById('home-categories-grid');
    try {
      const result = await window.api.get('/categories');
      if (!result.success || !Array.isArray(result.data)) throw new Error('Invalid categories');
      const categories = (result.data || []).filter(c => !/test/i.test(`${c.name} ${c.slug}`));
      element.innerHTML = categories.slice(0, 6).map(category => `<a class="home-category" href="/products.html?category=${encodeURIComponent(category._id)}"><img src="${escape(category.image || '/images/hero-running.jpg')}" alt="" loading="lazy" width="380" height="220"><span><strong>${escape(category.name)}</strong><span aria-hidden="true">↗</span></span></a>`).join('');
      const running = categories.find(c => c.slug === 'running');
      if (running) document.getElementById('home-running-link').href = `/products.html?category=${encodeURIComponent(running._id)}`;
      if (!categories.length) element.innerHTML = '<p class="home-empty">Khám phá các mẫu giày trong <a href="/products.html">danh mục sản phẩm</a>.</p>';
    } catch (_) { showLoadError(element); }
  };

  const loadBrands = async () => {
    const element = document.getElementById('home-brands-row');
    try {
      const result = await window.api.get('/brands');
      if (!result.success || !Array.isArray(result.data)) throw new Error('Invalid brands');
      element.innerHTML = (result.data || []).filter(b => !/test/i.test(`${b.name} ${b.slug}`)).map(brand => `<a class="home-brand" href="/products.html?brand=${encodeURIComponent(brand._id)}">${escape(brand.name)}<span aria-hidden="true">↗</span></a>`).join('');
    } catch (_) { showLoadError(element, false); }
  };

  const [best, newest] = await Promise.all([
    loadProducts('/products?sortBy=totalSold&order=desc&limit=4', 'home-bestsellers-grid'),
    loadProducts('/products?sortBy=createdAt&order=desc&limit=4', 'home-new-grid'),
    loadCategories(), loadBrands()
  ]);

  // Only show customer reviews returned by the API, never sample testimonials.
  const reviewProducts = [...new Map([...best, ...newest].map(p => [p._id, p])).values()];
  const results = await Promise.allSettled(reviewProducts.map(async product => {
    const result = await window.api.get(`/products/${product._id}/reviews`);
    return (result.data?.reviews || []).map(review => ({ ...review, product }));
  }));
  const reviews = results.filter(result => result.status === 'fulfilled').flatMap(result => result.value).filter(review => review.comment?.trim()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
  document.getElementById('home-reviews').innerHTML = reviews.length ? reviews.map(review => `<article class="home-review"><div><strong>${escape(review.user?.fullName || review.user?.name || 'Khách hàng')}</strong><span>${Number(review.rating)} / 5</span></div><p>${escape(review.comment)}</p><a href="/product-detail.html?id=${encodeURIComponent(review.product._id)}">${escape(review.product.name)} ↗</a></article>`).join('') : `<div class="home-empty home-review-empty"><p>${results.length && results.every(result => result.status === 'rejected') ? 'Chưa thể tải đánh giá lúc này.' : 'Chưa có đánh giá cho các sản phẩm đang giới thiệu.'}</p><span>Xem từng sản phẩm để tìm hiểu thông tin và nhận xét của người mua.</span><a class="section-link" href="/products.html">Khám phá sản phẩm ↗</a></div>`;
});
