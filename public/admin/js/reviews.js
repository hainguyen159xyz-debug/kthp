/**
 * ==========================================================================
 * SPORTZONE ADMIN - REVIEWS CONTROLLER (MODERATION)
 * ==========================================================================
 */

let currentReviewPage = 1;
const reviewLimit = 15;

async function loadReviews(page = 1) {
  currentReviewPage = page;
  const tbody = document.getElementById('reviews-table-body');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 40px;">Đang tải danh sách đánh giá...</td></tr>`;

  const rating = document.getElementById('review-filter-rating').value;

  const params = {
    page,
    limit: reviewLimit,
    rating
  };

  try {
    const res = await adminApi.get('/admin/reviews', params);
    if (!res || !res.success) throw new Error('Không thể tải đánh giá');

    const reviews = res.data || [];
    const pagination = res.pagination || { page: 1, limit: reviewLimit, total: reviews.length, totalPages: 1 };

    renderReviewsTable(reviews);
    renderReviewPagination(pagination);
  } catch (err) {
    console.error('Lỗi load reviews:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 30px;">${err.message || 'Lỗi nạp dữ liệu'}</td></tr>`;
  }
}

function renderReviewsTable(reviews) {
  const tbody = document.getElementById('reviews-table-body');
  if (reviews.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 40px;">Chưa có đánh giá nào</td></tr>`;
    return;
  }

  tbody.innerHTML = reviews.map((r) => {
    const p = r.product || {};
    const u = r.user || {};
    const imgUrl = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100';
    const userName = u.fullName || u.name || 'Khách hàng';
    const scoreBadge = `<span class="badge badge-success">${r.rating}.0 / 5.0</span>`;

    return `
      <tr>
        <td>
          <div class="table-product-cell">
            <img src="${imgUrl}" alt="${p.name || 'SP'}" class="table-product-thumb" onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100'">
            <div class="table-product-info">
              <span class="table-product-name">${p.name || 'Sản phẩm đã xóa'}</span>
            </div>
          </div>
        </td>
        <td>
          <div><strong>${userName}</strong></div>
          <div style="font-size: 0.78rem; color: var(--text-dim);">${u.email || ''}</div>
        </td>
        <td>
          ${scoreBadge}
        </td>
        <td style="max-width: 320px; white-space: normal; color: #fff;">
          ${r.comment ? `"${r.comment}"` : '<span style="color: var(--text-dim); font-style: italic;">Không có bình luận chữ</span>'}
        </td>
        <td style="color: var(--text-muted); font-size: 0.82rem;">${formatDateTime(r.createdAt)}</td>
        <td style="text-align: right;">
          <button class="btn btn-danger-outline btn-sm" onclick="handleDeleteReview('${r._id}')">
            Xóa đánh giá
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderReviewPagination({ page, limit, total, totalPages }) {
  const infoEl = document.getElementById('review-pagination-info');
  const controlsEl = document.getElementById('review-pagination-controls');

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  infoEl.textContent = `Hiển thị ${start} - ${end} trên tổng số ${total} đánh giá`;

  controlsEl.innerHTML = '';
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.innerHTML = '&lt;';
  prevBtn.disabled = page <= 1;
  prevBtn.onclick = () => loadReviews(page - 1);
  controlsEl.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      const pBtn = document.createElement('button');
      pBtn.className = `page-btn ${i === page ? 'active' : ''}`;
      pBtn.textContent = i;
      pBtn.onclick = () => loadReviews(i);
      controlsEl.appendChild(pBtn);
    }
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.innerHTML = '&gt;';
  nextBtn.disabled = page >= totalPages;
  nextBtn.onclick = () => loadReviews(page + 1);
  controlsEl.appendChild(nextBtn);
}

function handleDeleteReview(id) {
  adminModal.confirm({
    title: 'Xóa đánh giá',
    message: 'Bạn có chắc chắn muốn xóa đánh giá này khỏi hệ thống? Thao tác này không thể khôi phục.',
    confirmText: 'Xóa đánh giá',
    isDanger: true,
    onConfirm: async () => {
      try {
        await adminApi.delete(`/admin/reviews/${id}`);
        adminToast.success('Đã xóa đánh giá thành công.');
        loadReviews(currentReviewPage);
      } catch (err) {
        adminToast.error(err.message || 'Xóa đánh giá thất bại');
      }
    }
  });
}

function setupReviewEvents() {
  document.getElementById('review-filter-rating').addEventListener('change', () => loadReviews(1));

  document.getElementById('btn-reset-review').addEventListener('click', () => {
    document.getElementById('review-filter-rating').value = '';
    loadReviews(1);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupReviewEvents();
  loadReviews(1);
});
