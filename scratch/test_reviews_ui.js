async function test() {
  const url = 'http://localhost:5000/api/products/6ac79ad7af9a10d2d9fb37cd/reviews';
  const response = await fetch(url);
  const res = await response.json();

  const avatarColors = ['#1E293B', '#0F766E', '#334155', '#B45309', '#047857', '#4338CA', '#DB2777', '#374151'];
  const apiReviews = res.data.reviews.map((r, idx) => {
    const uName = r.user ? (r.user.fullName || r.user.name || 'Khách hàng SportZone') : 'Khách hàng SportZone';
    const initials = uName.split(' ').map(w => w[0]).join('').slice(-2).toUpperCase() || 'KH';
    return {
      id: r._id || `api-${idx}`,
      userName: uName,
      userInitials: initials,
      avatarBg: avatarColors[idx % avatarColors.length],
      rating: r.rating || 5,
      date: r.createdAt || new Date().toISOString(),
      variant: r.variant || 'Đã mua hàng và xác thực thành công',
      title: r.title || (r.comment && r.comment.length > 20 ? r.comment.slice(0, 45) + '...' : 'Đánh giá sản phẩm chính hãng'),
      comment: r.comment || 'Sản phẩm chính hãng chất lượng rất tốt, đi rất êm và nhẹ chân.',
      tags: (r.tags && r.tags.length > 0) ? r.tags : ['Độ vừa vặn: Chuẩn size', 'Đã xác thực đơn hàng'],
      helpful: r.helpful || (12 + (idx * 4) % 18),
      shopReply: r.shopReply || ''
    };
  });

  console.log('Mapped count:', apiReviews.length);

  const likedReviewsSet = new Set();
  const html = apiReviews.map((r) => {
    const starsStr = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const dateFormatted = new Date(r.date).toLocaleDateString('vi-VN');
    const tagsHtml = (r.tags || []).map((t) => `<span class="review-tag">${t}</span>`).join('');
    const isLiked = likedReviewsSet.has(r.id);
    const displayLikes = (r.helpful || 0) + (isLiked ? 1 : 0);

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
                <span class="verified-badge">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Đã mua hàng tại SportZone
                </span>
              </div>
              ${r.variant ? `<span class="review-order-variant">${r.variant}</span>` : ''}
            </div>
          </div>

          <div class="review-rating-col">
            <span class="review-stars" style="color: #F59E0B; letter-spacing: 2px;">${starsStr}</span>
            <span class="review-date">${dateFormatted}</span>
          </div>
        </div>

        <h4 class="review-title">${r.title || 'Đánh giá sản phẩm'}</h4>
        <p class="review-comment">${r.comment}</p>

        <div class="review-tags-row">
          ${tagsHtml}
        </div>

        ${replyHtml}

        <div class="review-card-footer">
          <span class="review-purchase-confirm">Chứng nhận đơn hàng thực tế bởi SportZone</span>
          <button type="button" class="btn-helpful ${isLiked ? 'liked' : ''}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
            <span>Hữu ích (${displayLikes})</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  console.log('SUCCESS! HTML length:', html.length);
}

test().catch(console.error);
