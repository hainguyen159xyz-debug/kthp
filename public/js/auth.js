/**
 * AUTHENTICATION & ACCESS GUARD
 * Sport Shoes E-Commerce & Inventory Management Platform
 */

const auth = {
  /**
   * Đăng ký tài khoản mới
   */
  async register(formData) {
    const { name, email, phone, password, confirmPassword } = formData;

    if (!name || !email || !password) {
      window.toast.error('Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu.');
      return false;
    }

    if (password !== confirmPassword) {
      window.toast.error('Mật khẩu xác nhận không khớp.');
      return false;
    }

    if (password.length < 6) {
      window.toast.error('Mật khẩu phải từ 6 ký tự trở lên.');
      return false;
    }

    try {
      const res = await window.api.post('/auth/register', {
        name,
        email,
        phone,
        password
      });

      if (res.success && res.data) {
        window.api.setToken(res.data.token);
        window.api.setUser(res.data.user);
        window.toast.success('Đăng ký tài khoản thành công!');
        window.dispatchEvent(new Event('authChange'));

        // Kiểm tra redirect URL
        const redirect = new URLSearchParams(window.location.search).get('redirect') || '/index.html';
        setTimeout(() => {
          window.location.href = redirect;
        }, 800);
        return true;
      }
    } catch (error) {
      window.toast.error(error.message || 'Đăng ký tài khoản thất bại.');
      return false;
    }
  },

  /**
   * Đăng nhập
   */
  async login(email, password) {
    if (!email || !password) {
      window.toast.error('Vui lòng nhập email và mật khẩu.');
      return false;
    }

    try {
      const res = await window.api.post('/auth/login', { email, password });

      if (res.success && res.data) {
        window.api.setToken(res.data.token);
        window.api.setUser(res.data.user);
        window.toast.success(`Chào mừng trở lại, ${res.data.user.fullName || res.data.user.name}!`);
        window.dispatchEvent(new Event('authChange'));

        const redirect = new URLSearchParams(window.location.search).get('redirect') || '/index.html';
        setTimeout(() => {
          window.location.href = redirect;
        }, 600);
        return true;
      }
    } catch (error) {
      window.toast.error(error.message || 'Email hoặc mật khẩu không chính xác.');
      return false;
    }
  },

  /**
   * Auth Guard: Kiểm tra người dùng đã đăng nhập chưa
   * Nếu chưa, chuyển hướng sang login.html kèm redirect query
   */
  requireAuth() {
    if (!window.api.isLoggedIn()) {
      const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login.html?redirect=${currentUrl}`;
      return false;
    }
    return true;
  }
};

window.auth = auth;
