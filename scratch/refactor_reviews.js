// One-off refactor: fix TDZ bug for review state, remove hardcoded fallback reviews
// and remove the "write review" modal logic from product-detail.js
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'public', 'js', 'product-detail.js');
let src = fs.readFileSync(file, 'utf8');
const EOL = src.includes('\r\n') ? '\r\n' : '\n';
src = src.replace(/\r\n/g, '\n');

function mustFind(str, from = 0) {
  const idx = src.indexOf(str, from);
  if (idx === -1) throw new Error('Not found: ' + str.slice(0, 60));
  return idx;
}

// 1. Remove late declarations + getDefaultVerifiedReviews()
const declStart = mustFind('  let currentReviewsList = [];\n');
const fetchDoc = mustFind('  /**\n   * Tải danh sách đánh giá\n   */', declStart);
src = src.slice(0, declStart) + src.slice(fetchDoc);

// 2. Declare review state at the top (before any await) to avoid TDZ ReferenceError
const anchor = '  let maxStock = 0;\n';
const anchorIdx = mustFind(anchor);
const stateBlock =
  '\n  // Trạng thái danh sách đánh giá (khai báo sớm để dùng được ngay khi tải trang)\n' +
  '  let currentReviewsList = [];\n' +
  "  let currentSortOption = 'newest';\n" +
  "  let currentRatingFilter = 'all';\n" +
  '  const likedReviewsSet = new Set();\n';
src = src.slice(0, anchorIdx + anchor.length) + stateBlock + src.slice(anchorIdx + anchor.length);

// 3. Drop merge with hardcoded defaults
const mergeStart = mustFind('      // Kết hợp với danh sách đánh giá mẫu xác thực nếu sản phẩm chưa có đủ\n');
const mergeEnd = mustFind('      currentReviewsList = combined;\n', mergeStart);
src = src.slice(0, mergeStart) + src.slice(mergeEnd);
src = src.replace('        // Fallback silently to verified seeded reviews\n', "        console.warn('Không tải được đánh giá:', e.message);\n");

// 4. Remove write-review modal logic
const modalStart = mustFind('  // Xử lý Modal Viết Đánh Giá\n');
const relatedDoc = mustFind('  /**\n   * Tải sản phẩm liên quan', modalStart);
src = src.slice(0, modalStart) + src.slice(relatedDoc);

fs.writeFileSync(file, src.replace(/\n/g, EOL), 'utf8');
console.log('OK');
