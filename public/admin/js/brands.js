/**
 * ==========================================================================
 * SPORTZONE ADMIN - BRANDS CONTROLLER
 * ==========================================================================
 */

let allBrands = [];

async function loadBrands() {
  const tbody = document.getElementById('brand-table-body');
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 40px;">Đang tải thương hiệu...</td></tr>`;

  try {
    const res = await adminApi.get('/brands');
    if (!res || !res.success) throw new Error('Không thể tải thương hiệu');

    allBrands = res.data || [];
    renderBrandsTable(allBrands);
  } catch (err) {
    console.error('Lỗi nạp brands:', err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 30px;">${err.message || 'Lỗi kết nối'}</td></tr>`;
  }
}

function renderBrandsTable(brands) {
  const tbody = document.getElementById('brand-table-body');
  if (brands.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 40px;">Chưa có thương hiệu nào</td></tr>`;
    return;
  }

  tbody.innerHTML = brands.map((b) => {
    const isActive = b.status === 'active' || b.isActive !== false;
    const logoUrl = b.logo || '';

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            ${logoUrl ? `<img src="${logoUrl}" alt="${b.name}" style="width: 38px; height: 38px; border-radius: var(--radius-sm); object-fit: contain; background: #fff; padding: 2px;" onerror="this.style.display='none'">` : `<div style="width: 38px; height: 38px; border-radius: var(--radius-sm); background: var(--bg-card); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff;">${b.name.charAt(0)}</div>`}
            <div>
              <strong style="color: #fff; font-size: 0.95rem;">${b.name}</strong>
            </div>
          </div>
        </td>
        <td><code>${b.slug}</code></td>
        <td style="color: var(--text-muted); max-width: 320px; white-space: normal;">${b.description || 'Không có mô tả'}</td>
        <td>
          <span class="badge ${isActive ? 'badge-success' : 'badge-neutral'}">
            ${isActive ? 'Hoạt động' : 'Tạm ẩn'}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="openEditBrand('${b._id}')">
              Sửa
            </button>
            <button class="btn btn-danger-outline btn-sm" onclick="handleDeleteBrand('${b._id}', '${b.name.replace(/'/g, "\\'")}')">
              Xóa
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openCreateBrand() {
  document.getElementById('brand-modal-title').textContent = 'Thêm Thương Hiệu Mới';
  document.getElementById('brand-id').value = '';
  document.getElementById('brand-name').value = '';
  document.getElementById('brand-logo').value = '';
  document.getElementById('brand-slug').value = '';
  document.getElementById('brand-desc').value = '';
  document.getElementById('brand-status').checked = true;
  adminModal.open('brand-modal');
}

function openEditBrand(id) {
  const b = allBrands.find((brand) => brand._id === id);
  if (!b) return;

  document.getElementById('brand-modal-title').textContent = 'Chỉnh Sửa Thương Hiệu';
  document.getElementById('brand-id').value = b._id;
  document.getElementById('brand-name').value = b.name || '';
  document.getElementById('brand-logo').value = b.logo || '';
  document.getElementById('brand-slug').value = b.slug || '';
  document.getElementById('brand-desc').value = b.description || '';
  document.getElementById('brand-status').checked = b.status === 'active' || b.isActive !== false;

  adminModal.open('brand-modal');
}

function handleDeleteBrand(id, name) {
  adminModal.confirm({
    title: 'Xóa thương hiệu',
    message: `Bạn có chắc chắn muốn xóa thương hiệu "${name}"? Thao tác sẽ bị từ chối nếu còn sản phẩm thuộc thương hiệu này.`,
    confirmText: 'Xóa ngay',
    isDanger: true,
    onConfirm: async () => {
      try {
        await adminApi.delete(`/brands/${id}`);
        adminToast.success(`Đã xóa thương hiệu "${name}" thành công.`);
        loadBrands();
      } catch (err) {
        adminToast.error(err.message || 'Không thể xóa thương hiệu này.');
      }
    }
  });
}

function setupBrandEvents() {
  document.getElementById('btn-open-create-brand').addEventListener('click', openCreateBrand);

  document.getElementById('brand-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderBrandsTable(allBrands);
    } else {
      const filtered = allBrands.filter((b) =>
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.slug && b.slug.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q))
      );
      renderBrandsTable(filtered);
    }
  });

  document.getElementById('brand-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('brand-id').value;
    const name = document.getElementById('brand-name').value.trim();
    const logo = document.getElementById('brand-logo').value.trim();
    const slug = document.getElementById('brand-slug').value.trim();
    const description = document.getElementById('brand-desc').value.trim();
    const isActive = document.getElementById('brand-status').checked;

    if (!name) {
      adminToast.warning('Vui lòng nhập tên thương hiệu.');
      return;
    }

    const payload = {
      name,
      logo,
      description,
      status: isActive ? 'active' : 'inactive',
      isActive
    };
    if (slug) payload.slug = slug;

    const saveBtn = document.getElementById('btn-save-brand');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Đang lưu...';

    try {
      if (id) {
        await adminApi.put(`/brands/${id}`, payload);
        adminToast.success('Cập nhật thương hiệu thành công!');
      } else {
        await adminApi.post('/brands', payload);
        adminToast.success('Thêm thương hiệu mới thành công!');
      }
      adminModal.close('brand-modal');
      loadBrands();
    } catch (err) {
      adminToast.error(err.message || 'Lưu thương hiệu thất bại.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Lưu Thương Hiệu';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupBrandEvents();
  loadBrands();
});
