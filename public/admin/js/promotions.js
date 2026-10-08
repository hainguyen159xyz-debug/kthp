/**
 * ==========================================================================
 * SPORTZONE ADMIN - PROMOTIONS CONTROLLER
 * ==========================================================================
 */

let allPromotions = [];

async function loadPromotions() {
  const tbody = document.getElementById('promo-table-body');
  tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-dim); padding: 40px;">Đang tải danh sách khuyến mãi...</td></tr>`;

  try {
    const res = await adminApi.get('/promotions');
    if (!res || !res.success) throw new Error('Không thể tải khuyến mãi');

    allPromotions = res.data || [];
    renderPromotionsTable(allPromotions);
  } catch (err) {
    console.error('Lỗi load promotions:', err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--danger); padding: 30px;">${err.message || 'Lỗi nạp dữ liệu'}</td></tr>`;
  }
}

function renderPromotionsTable(promotions) {
  const tbody = document.getElementById('promo-table-body');
  if (promotions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-dim); padding: 40px;">Chưa có mã khuyến mãi nào</td></tr>`;
    return;
  }

  tbody.innerHTML = promotions.map((p) => {
    const isPercent = p.discountType === 'percentage';
    const discountStr = isPercent ? `${p.discountValue}%` : formatCurrency(p.discountValue);
    const maxDiscountStr = p.maxDiscountAmount ? formatCurrency(p.maxDiscountAmount) : 'Không giới hạn';
    const isActive = p.status === 'active' || p.isActive !== false;

    // Check expiration
    const isExpired = new Date(p.endDate) < new Date();
    let statusBadge = '<span class="badge badge-success">Đang áp dụng</span>';
    if (isExpired) {
      statusBadge = '<span class="badge badge-danger">Đã hết hạn</span>';
    } else if (!isActive) {
      statusBadge = '<span class="badge badge-neutral">Tạm dừng</span>';
    }

    return `
      <tr>
        <td>
          <strong style="color: #60a5fa; font-family: monospace; font-size: 0.95rem; background: rgba(59, 130, 246, 0.1); padding: 4px 8px; border-radius: var(--radius-sm); border: 1px dashed rgba(59, 130, 246, 0.3);">
            ${p.code}
          </strong>
        </td>
        <td><strong style="color: #fff;">${p.name}</strong></td>
        <td><strong style="color: #34d399;">${discountStr}</strong></td>
        <td>${formatCurrency(p.minOrderValue || 0)}</td>
        <td>${maxDiscountStr}</td>
        <td>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${formatDate(p.startDate)} - ${formatDate(p.endDate)}</div>
        </td>
        <td>${p.usedCount || 0} / ${p.usageLimit || '∞'}</td>
        <td>${statusBadge}</td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="openEditPromotion('${p._id}')">
              ✏️ Sửa
            </button>
            <button class="btn btn-danger-outline btn-sm" onclick="handleDeletePromotion('${p._id}', '${p.code}')">
              🗑️ Xóa
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openCreatePromotion() {
  document.getElementById('promo-modal-title').textContent = 'Tạo Mã Khuyến Mãi Mới';
  document.getElementById('promo-id').value = '';
  document.getElementById('promo-code').value = '';
  document.getElementById('promo-name').value = '';
  document.getElementById('promo-type').value = 'percentage';
  document.getElementById('promo-value').value = '';
  document.getElementById('promo-min-order').value = '0';
  document.getElementById('promo-max-discount').value = '';
  
  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  document.getElementById('promo-start').value = today;
  document.getElementById('promo-end').value = nextMonth;
  document.getElementById('promo-limit').value = '100';
  document.getElementById('promo-status').checked = true;

  adminModal.open('promo-modal');
}

function openEditPromotion(id) {
  const p = allPromotions.find((item) => item._id === id);
  if (!p) return;

  document.getElementById('promo-modal-title').textContent = 'Chỉnh Sửa Mã Khuyến Mãi';
  document.getElementById('promo-id').value = p._id;
  document.getElementById('promo-code').value = p.code || '';
  document.getElementById('promo-name').value = p.name || '';
  document.getElementById('promo-type').value = p.discountType || 'percentage';
  document.getElementById('promo-value').value = p.discountValue || '';
  document.getElementById('promo-min-order').value = p.minOrderValue || 0;
  document.getElementById('promo-max-discount').value = p.maxDiscountAmount || '';
  
  if (p.startDate) {
    document.getElementById('promo-start').value = new Date(p.startDate).toISOString().slice(0, 10);
  }
  if (p.endDate) {
    document.getElementById('promo-end').value = new Date(p.endDate).toISOString().slice(0, 10);
  }
  document.getElementById('promo-limit').value = p.usageLimit || 100;
  document.getElementById('promo-status').checked = p.status === 'active' || p.isActive !== false;

  adminModal.open('promo-modal');
}

function handleDeletePromotion(id, code) {
  adminModal.confirm({
    title: 'Xóa mã khuyến mãi',
    message: `Bạn có chắc chắn muốn xóa mã "${code}"? Khách hàng sẽ không thể áp dụng mã này nữa.`,
    confirmText: 'Xóa ngay',
    isDanger: true,
    onConfirm: async () => {
      try {
        await adminApi.delete(`/promotions/${id}`);
        adminToast.success(`Đã xóa mã voucher "${code}" thành công.`);
        loadPromotions();
      } catch (err) {
        adminToast.error(err.message || 'Không thể xóa mã khuyến mãi này');
      }
    }
  });
}

function setupPromoEvents() {
  document.getElementById('btn-open-create-promo').addEventListener('click', openCreatePromotion);

  document.getElementById('promo-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderPromotionsTable(allPromotions);
    } else {
      const filtered = allPromotions.filter((p) =>
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.name && p.name.toLowerCase().includes(q))
      );
      renderPromotionsTable(filtered);
    }
  });

  document.getElementById('promo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('promo-id').value;
    const code = document.getElementById('promo-code').value.trim().toUpperCase();
    const name = document.getElementById('promo-name').value.trim();
    const discountType = document.getElementById('promo-type').value;
    const discountValue = Number(document.getElementById('promo-value').value);
    const minOrderValue = Number(document.getElementById('promo-min-order').value) || 0;
    const maxDiscountAmount = document.getElementById('promo-max-discount').value ? Number(document.getElementById('promo-max-discount').value) : null;
    const startDate = document.getElementById('promo-start').value;
    const endDate = document.getElementById('promo-end').value;
    const usageLimit = Number(document.getElementById('promo-limit').value) || 100;
    const isActive = document.getElementById('promo-status').checked;

    if (!code || !name || !discountValue || !endDate) {
      adminToast.warning('Vui lòng điền đủ các thông tin bắt buộc.');
      return;
    }

    const payload = {
      code,
      name,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      startDate: startDate || new Date(),
      endDate,
      usageLimit,
      status: isActive ? 'active' : 'inactive',
      isActive
    };

    const saveBtn = document.getElementById('btn-save-promo');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Đang lưu...';

    try {
      if (id) {
        await adminApi.put(`/promotions/${id}`, payload);
        adminToast.success('Cập nhật mã khuyến mãi thành công!');
      } else {
        await adminApi.post('/promotions', payload);
        adminToast.success('Tạo mã khuyến mãi mới thành công!');
      }
      adminModal.close('promo-modal');
      loadPromotions();
    } catch (err) {
      adminToast.error(err.message || 'Lưu mã khuyến mãi thất bại');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Lưu Mã Giảm Giá';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupPromoEvents();
  loadPromotions();
});
