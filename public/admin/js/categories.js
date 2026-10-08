/**
 * ==========================================================================
 * SPORTZONE ADMIN - CATEGORIES CONTROLLER
 * ==========================================================================
 */

let allCategories = [];

async function loadCategories() {
  const tbody = document.getElementById('category-table-body');
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 40px;">Đang tải danh mục...</td></tr>`;

  try {
    const res = await adminApi.get('/categories');
    if (!res || !res.success) throw new Error('Không thể tải danh mục');

    allCategories = res.data || [];
    renderCategoriesTable(allCategories);
  } catch (err) {
    console.error('Lỗi nạp categories:', err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 30px;">${err.message || 'Lỗi kết nối'}</td></tr>`;
  }
}

function renderCategoriesTable(categories) {
  const tbody = document.getElementById('category-table-body');
  if (categories.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 40px;">Chưa có danh mục nào</td></tr>`;
    return;
  }

  tbody.innerHTML = categories.map((cat) => {
    const isActive = cat.status === 'active' || cat.isActive !== false;
    return `
      <tr>
        <td><strong style="color: #fff;">${cat.name}</strong></td>
        <td><code>${cat.slug}</code></td>
        <td style="color: var(--text-muted); max-width: 320px; white-space: normal;">${cat.description || 'Không có mô tả'}</td>
        <td>
          <span class="badge ${isActive ? 'badge-success' : 'badge-neutral'}">
            ${isActive ? 'Hoạt động' : 'Tạm ẩn'}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="openEditCategory('${cat._id}')">
              Sửa
            </button>
            <button class="btn btn-danger-outline btn-sm" onclick="handleDeleteCategory('${cat._id}', '${cat.name.replace(/'/g, "\\'")}')">
              Xóa
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openCreateCategory() {
  document.getElementById('cat-modal-title').textContent = 'Thêm Danh Mục Mới';
  document.getElementById('cat-id').value = '';
  document.getElementById('cat-name').value = '';
  document.getElementById('cat-slug').value = '';
  document.getElementById('cat-desc').value = '';
  document.getElementById('cat-status').checked = true;
  adminModal.open('category-modal');
}

function openEditCategory(id) {
  const cat = allCategories.find((c) => c._id === id);
  if (!cat) return;

  document.getElementById('cat-modal-title').textContent = 'Chỉnh Sửa Danh Mục';
  document.getElementById('cat-id').value = cat._id;
  document.getElementById('cat-name').value = cat.name || '';
  document.getElementById('cat-slug').value = cat.slug || '';
  document.getElementById('cat-desc').value = cat.description || '';
  document.getElementById('cat-status').checked = cat.status === 'active' || cat.isActive !== false;

  adminModal.open('category-modal');
}

function handleDeleteCategory(id, name) {
  adminModal.confirm({
    title: 'Xóa danh mục',
    message: `Bạn có chắc chắn muốn xóa danh mục "${name}"? Thao tác sẽ bị từ chối nếu còn sản phẩm thuộc danh mục này.`,
    confirmText: 'Xóa ngay',
    isDanger: true,
    onConfirm: async () => {
      try {
        await adminApi.delete(`/categories/${id}`);
        adminToast.success(`Đã xóa danh mục "${name}" thành công.`);
        loadCategories();
      } catch (err) {
        adminToast.error(err.message || 'Không thể xóa danh mục này.');
      }
    }
  });
}

function setupCategoryEvents() {
  document.getElementById('btn-open-create-category').addEventListener('click', openCreateCategory);

  // Search filter
  document.getElementById('category-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderCategoriesTable(allCategories);
    } else {
      const filtered = allCategories.filter((c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.slug && c.slug.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
      renderCategoriesTable(filtered);
    }
  });

  // Submit Form
  document.getElementById('category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('cat-id').value;
    const name = document.getElementById('cat-name').value.trim();
    const slug = document.getElementById('cat-slug').value.trim();
    const description = document.getElementById('cat-desc').value.trim();
    const isActive = document.getElementById('cat-status').checked;

    if (!name) {
      adminToast.warning('Vui lòng nhập tên danh mục.');
      return;
    }

    const payload = {
      name,
      description,
      status: isActive ? 'active' : 'inactive',
      isActive
    };
    if (slug) payload.slug = slug;

    const saveBtn = document.getElementById('btn-save-category');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Đang lưu...';

    try {
      if (id) {
        await adminApi.put(`/categories/${id}`, payload);
        adminToast.success('Cập nhật danh mục thành công!');
      } else {
        await adminApi.post('/categories', payload);
        adminToast.success('Thêm danh mục mới thành công!');
      }
      adminModal.close('category-modal');
      loadCategories();
    } catch (err) {
      adminToast.error(err.message || 'Lưu danh mục thất bại.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Lưu Danh Mục';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupCategoryEvents();
  loadCategories();
});
