/**
 * ==========================================================================
 * SPORTZONE ADMIN - SUPPLIERS CONTROLLER
 * ==========================================================================
 */

let allSuppliers = [];

async function loadSuppliers() {
  const tbody = document.getElementById('suppliers-table-body');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 40px;">Đang tải danh sách nhà cung cấp...</td></tr>`;

  try {
    const res = await adminApi.get('/suppliers');
    if (!res || !res.success) throw new Error('Không thể tải nhà cung cấp');

    allSuppliers = res.data || [];
    renderSuppliersTable(allSuppliers);
  } catch (err) {
    console.error('Lỗi nạp suppliers:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger); padding: 30px;">${err.message || 'Lỗi kết nối'}</td></tr>`;
  }
}

function renderSuppliersTable(suppliers) {
  const tbody = document.getElementById('suppliers-table-body');
  if (suppliers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 40px;">Chưa có nhà cung cấp nào</td></tr>`;
    return;
  }

  tbody.innerHTML = suppliers.map((s) => {
    const isActive = s.status === 'active' || s.isActive !== false;
    return `
      <tr>
        <td><strong style="color: #fff;">${s.name}</strong></td>
        <td>${s.contactPerson || s.contactName || '<span style="color: var(--text-dim);">N/A</span>'}</td>
        <td><span style="color: #60a5fa; font-weight: 600;">${s.phone}</span></td>
        <td>${s.email}</td>
        <td style="color: var(--text-muted); max-width: 200px; white-space: normal;">${s.address || 'N/A'}</td>
        <td><span class="badge badge-neutral">${s.leadTimeDays || s.deliveryTimeDays || 2} ngày</span></td>
        <td>
          <span class="badge ${isActive ? 'badge-success' : 'badge-neutral'}">
            ${isActive ? 'Đang hợp tác' : 'Tạm dừng'}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="openEditSupplier('${s._id}')">
              ✏️ Sửa
            </button>
            <button class="btn btn-danger-outline btn-sm" onclick="handleDeleteSupplier('${s._id}', '${s.name.replace(/'/g, "\\'")}')">
              🗑️ Xóa
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openCreateSupplier() {
  document.getElementById('sup-modal-title').textContent = 'Thêm Nhà Cung Cấp Mới';
  document.getElementById('sup-id').value = '';
  document.getElementById('sup-name').value = '';
  document.getElementById('sup-contact').value = '';
  document.getElementById('sup-phone').value = '';
  document.getElementById('sup-email').value = '';
  document.getElementById('sup-leadtime').value = '2';
  document.getElementById('sup-address').value = '';
  document.getElementById('sup-status').checked = true;

  adminModal.open('supplier-modal');
}

function openEditSupplier(id) {
  const s = allSuppliers.find((sup) => sup._id === id);
  if (!s) return;

  document.getElementById('sup-modal-title').textContent = 'Chỉnh Sửa Nhà Cung Cấp';
  document.getElementById('sup-id').value = s._id;
  document.getElementById('sup-name').value = s.name || '';
  document.getElementById('sup-contact').value = s.contactPerson || s.contactName || '';
  document.getElementById('sup-phone').value = s.phone || '';
  document.getElementById('sup-email').value = s.email || '';
  document.getElementById('sup-leadtime').value = s.leadTimeDays || s.deliveryTimeDays || 2;
  document.getElementById('sup-address').value = s.address || '';
  document.getElementById('sup-status').checked = s.status === 'active' || s.isActive !== false;

  adminModal.open('supplier-modal');
}

function handleDeleteSupplier(id, name) {
  adminModal.confirm({
    title: 'Xóa nhà cung cấp',
    message: `Bạn có chắc chắn muốn xóa nhà cung cấp "${name}"?`,
    confirmText: 'Xóa ngay',
    isDanger: true,
    onConfirm: async () => {
      try {
        await adminApi.delete(`/suppliers/${id}`);
        adminToast.success(`Đã xóa nhà cung cấp "${name}" thành công.`);
        loadSuppliers();
      } catch (err) {
        adminToast.error(err.message || 'Không thể xóa nhà cung cấp này.');
      }
    }
  });
}

function setupSupplierEvents() {
  document.getElementById('btn-open-create-supplier').addEventListener('click', openCreateSupplier);

  document.getElementById('supplier-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderSuppliersTable(allSuppliers);
    } else {
      const filtered = allSuppliers.filter((s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
        (s.contactName && s.contactName.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
      renderSuppliersTable(filtered);
    }
  });

  document.getElementById('supplier-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('sup-id').value;
    const name = document.getElementById('sup-name').value.trim();
    const contactName = document.getElementById('sup-contact').value.trim();
    const phone = document.getElementById('sup-phone').value.trim();
    const email = document.getElementById('sup-email').value.trim();
    const leadTimeDays = Number(document.getElementById('sup-leadtime').value) || 2;
    const address = document.getElementById('sup-address').value.trim();
    const isActive = document.getElementById('sup-status').checked;

    if (!name || !phone || !email) {
      adminToast.warning('Vui lòng điền đủ tên NCC, số điện thoại và email.');
      return;
    }

    const payload = {
      name,
      contactPerson: contactName,
      contactName,
      phone,
      email,
      leadTimeDays,
      deliveryTimeDays: leadTimeDays,
      address,
      status: isActive ? 'active' : 'inactive',
      isActive
    };

    const saveBtn = document.getElementById('btn-save-supplier');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Đang lưu...';

    try {
      if (id) {
        await adminApi.put(`/suppliers/${id}`, payload);
        adminToast.success('Cập nhật nhà cung cấp thành công!');
      } else {
        await adminApi.post('/suppliers', payload);
        adminToast.success('Thêm nhà cung cấp mới thành công!');
      }
      adminModal.close('supplier-modal');
      loadSuppliers();
    } catch (err) {
      adminToast.error(err.message || 'Lưu nhà cung cấp thất bại.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Lưu Nhà Cung Cấp';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupSupplierEvents();
  loadSuppliers();
});
