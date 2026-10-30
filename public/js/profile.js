document.addEventListener('DOMContentLoaded', () => {
  if (!window.auth.requireAuth()) return;
  const get = id => document.getElementById(id);
  const form = get('profile-form'), pwdForm = get('password-form'), save = get('btn-save-profile');
  const keys = ['name', 'phone', 'address', 'ward', 'city'];
  let baseline = '', saving = false, extra = {};
  const values = () => keys.map(key => get(`profile-${key}-input`).value.trim());
  const dirty = () => baseline !== '' && JSON.stringify(values()) !== baseline;
  function state() {
    save.disabled = saving || !dirty();
    get('profile-save-state').textContent = dirty() ? 'Có thay đổi chưa lưu' : '';
  }
  function error(input, target, message) {
    get(input).setAttribute('aria-invalid', String(Boolean(message)));
    get(target).textContent = message;
    return Boolean(message);
  }
  function identity(u) {
    const name = u.fullName || u.name || 'Khách hàng';
    get('profile-card-name').textContent = name;
    get('profile-card-email').textContent = u.email || '';
    get('profile-avatar').textContent = name.trim().split(/\s+/).slice(-2).map(p => Array.from(p)[0]).join('').toLocaleUpperCase('vi');
  }
  async function load() {
    get('profile-retry').hidden = true;
    get('profile-status').hidden = false;
    get('profile-status').querySelector('p').textContent = 'Đang tải thông tin…';
    try {
      const res = await window.api.get('/auth/me');
      if (!res.success || !res.data) throw new Error();
      const u = res.data; identity(u);
      get('profile-name-input').value = u.fullName || u.name || '';
      get('profile-phone-input').value = u.phone || '';
      extra = typeof u.address === 'object' && u.address ? { ...u.address } : {};
      get('profile-address-input').value = typeof u.address === 'string' ? u.address : extra.street || '';
      await window.createAddressPicker(get('profile-city-input'), get('profile-ward-input'), extra);
      baseline = JSON.stringify(values()); state();
      get('profile-content').hidden = false;
      get('profile-status').hidden = true;
    } catch {
      get('profile-status').querySelector('p').textContent = 'Không thể tải thông tin tài khoản. Vui lòng thử lại.';
      get('profile-retry').hidden = false;
    }
  }
  get('profile-retry').onclick = load;
  form.addEventListener('input', state);
  form.addEventListener('change', state);
  window.addEventListener('beforeunload', e => { if (dirty()) { e.preventDefault(); e.returnValue = ''; } });
  form.onsubmit = async e => {
    e.preventDefault(); if (saving || !dirty()) return;
    const [name, phone, street, ward, city] = values();
    const normalized = phone.replace(/[\s().-]/g, '');
    const badName = error('profile-name-input', 'name-error', !name ? 'Vui lòng nhập họ và tên.' : name.length > 100 ? 'Họ tên tối đa 100 ký tự.' : '');
    const badPhone = error('profile-phone-input', 'phone-error', phone && !/^(0\d{9}|\+84\d{9})$/.test(normalized) ? 'Nhập số điện thoại Việt Nam gồm 10 số hoặc bắt đầu bằng +84.' : '');
    if (badName || badPhone) { form.querySelector('[aria-invalid="true"]').focus(); return; }
    const submitted = JSON.stringify(values());
    saving = true; state(); save.textContent = 'Đang lưu…';
    try {
      const address = { ...extra, street, ward, city };
      if (city !== extra.city || ward !== extra.ward) address.district = '';
      const res = await window.api.put('/auth/profile', { name, phone: normalized, address });
      if (!res.success || !res.data) throw new Error(res.message || 'Không thể lưu thay đổi.');
      window.api.setUser(res.data); identity(res.data); extra = address; baseline = submitted;
      window.dispatchEvent(new Event('authChange'));
      window.toast.success('Đã lưu thông tin tài khoản.');
    } catch (err) { window.toast.error(err.message || 'Không thể lưu thay đổi.'); }
    finally { saving = false; save.textContent = 'Lưu thay đổi'; state(); }
  };
  let changing = false;
  pwdForm.onsubmit = async e => {
    e.preventDefault(); if (changing) return;
    const currentPassword = get('pwd-current').value, newPassword = get('pwd-new').value, confirm = get('pwd-confirm').value;
    const errors = [
      error('pwd-current', 'current-error', currentPassword ? '' : 'Nhập mật khẩu hiện tại.'),
      error('pwd-new', 'new-error', newPassword.length < 6 ? 'Mật khẩu mới phải có ít nhất 6 ký tự.' : newPassword === currentPassword ? 'Chọn mật khẩu khác mật khẩu hiện tại.' : ''),
      error('pwd-confirm', 'confirm-error', !confirm ? 'Nhập lại mật khẩu mới.' : confirm !== newPassword ? 'Mật khẩu xác nhận không khớp.' : '')
    ];
    if (errors.some(Boolean)) { pwdForm.querySelector('[aria-invalid="true"]').focus(); return; }
    const button = get('btn-change-password'); changing = true; button.disabled = true; button.textContent = 'Đang cập nhật…';
    try {
      const res = await window.api.put('/auth/change-password', { currentPassword, newPassword });
      if (!res.success) throw new Error(res.message || 'Không thể đổi mật khẩu.');
      pwdForm.reset(); window.toast.success('Đã đổi mật khẩu thành công.');
    } catch (err) { window.toast.error(err.message || 'Không thể đổi mật khẩu.'); }
    finally { changing = false; button.disabled = false; button.textContent = 'Cập nhật mật khẩu'; }
  };
  get('btn-profile-logout').onclick = () => {
    if (dirty() && !window.confirm('Bạn có thay đổi chưa lưu. Đăng xuất và bỏ các thay đổi này?')) return;
    baseline = ''; window.api.logout();
  };
  load();
});
