/**
 * USER PROFILE CONTROLLER (profile.html)
 * Sport Shoes E-Commerce & Inventory Management Platform
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.auth.requireAuth()) return;

  // Elements
  const cardName = document.getElementById('profile-card-name');
  const cardEmail = document.getElementById('profile-card-email');
  const nameInput = document.getElementById('profile-name-input');
  const emailInput = document.getElementById('profile-email-input');
  const phoneInput = document.getElementById('profile-phone-input');
  const addressInput = document.getElementById('profile-address-input');
  const btnSaveProfile = document.getElementById('btn-save-profile');
  const profileForm = document.getElementById('profile-form');
  const passwordForm = document.getElementById('password-form');
  const btnChangePwd = document.getElementById('btn-change-password');
  const btnLogout = document.getElementById('btn-profile-logout');

  // Load user data
  await loadUserProfile();

  // Save profile info
  if (profileForm) {
    profileForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();
      const address = addressInput.value.trim();

      if (!name) {
        window.toast.warning('Họ tên không được để trống.');
        return;
      }

      try {
        btnSaveProfile.disabled = true;
        btnSaveProfile.textContent = '⏳ Đang lưu...';

        const res = await window.api.put('/auth/profile', {
          name,
          phone,
          address
        });

        if (res.success && res.data) {
          window.api.setUser(res.data);
          window.toast.success('Cập nhật thông tin thành công!');
          cardName.textContent = res.data.fullName || res.data.name;
          window.dispatchEvent(new Event('authChange'));
        }
      } catch (err) {
        window.toast.error(err.message || 'Không thể lưu thay đổi.');
      } finally {
        btnSaveProfile.disabled = false;
        btnSaveProfile.textContent = 'Lưu thay đổi thông tin';
      }
    };
  }

  // Change password
  if (passwordForm) {
    passwordForm.onsubmit = async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('pwd-current').value;
      const newPassword = document.getElementById('pwd-new').value;
      const confirmPassword = document.getElementById('pwd-confirm').value;

      if (newPassword !== confirmPassword) {
        window.toast.warning('Mật khẩu mới và xác nhận mật khẩu không khớp.');
        return;
      }

      if (newPassword.length < 6) {
        window.toast.warning('Mật khẩu mới phải từ 6 ký tự trở lên.');
        return;
      }

      try {
        btnChangePwd.disabled = true;
        btnChangePwd.textContent = '⏳ Đang cập nhật...';

        const res = await window.api.put('/auth/change-password', {
          currentPassword,
          newPassword
        });

        if (res.success) {
          window.toast.success('Đổi mật khẩu thành công!');
          passwordForm.reset();
        }
      } catch (err) {
        window.toast.error(err.message || 'Mật khẩu hiện tại không đúng.');
      } finally {
        btnChangePwd.disabled = false;
        btnChangePwd.textContent = 'Cập nhật mật khẩu mới';
      }
    };
  }

  // Logout button
  if (btnLogout) {
    btnLogout.onclick = () => {
      window.api.logout();
    };
  }

  async function loadUserProfile() {
    try {
      const res = await window.api.get('/auth/me');
      if (res.success && res.data) {
        const u = res.data;
        const displayName = u.fullName || u.name || 'Khách hàng';

        cardName.textContent = displayName;
        cardEmail.textContent = u.email;
        nameInput.value = displayName;
        emailInput.value = u.email;
        phoneInput.value = u.phone || '';

        if (typeof u.address === 'string') {
          addressInput.value = u.address;
        } else if (typeof u.address === 'object' && u.address) {
          addressInput.value = [u.address.street, u.address.district, u.address.city].filter(Boolean).join(', ');
        }
      }
    } catch (err) {
      window.toast.error('Không thể tải thông tin cá nhân.');
    }
  }
});
