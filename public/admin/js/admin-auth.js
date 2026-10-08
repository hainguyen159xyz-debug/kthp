/**
 * ==========================================================================
 * SPORTZONE ADMIN - AUTHENTICATION & ROLE-BASED ACCESS CONTROL
 * ==========================================================================
 */

const adminAuth = {
  // Kiểm tra quyền Admin khi tải trang
  async checkAuth() {
    const isLoginPage = window.location.pathname.endsWith('login.html');
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      if (!isLoginPage) {
        window.location.replace('/admin/login.html');
      }
      return null;
    }

    try {
      const user = JSON.parse(userStr);

      // Chặn ngay lập tức nếu role không phải là admin
      if (user.role !== 'admin') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!isLoginPage) {
          window.location.replace('/admin/login.html?error=unauthorized');
        }
        return null;
      }

      // Xác thực lại token với backend để chống giả mạo localStorage
      if (!isLoginPage) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const verified = await res.json();
          if (!res.ok || verified.data?.role !== 'admin') {
            throw new Error('Invalid Admin Token');
          }
          // Cập nhật lại thông tin mới nhất
          localStorage.setItem('user', JSON.stringify(verified.data));
          this.renderAdminHeader(verified.data);
        } catch (e) {
          console.error('Session validation error:', e);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.replace('/admin/login.html');
          return null;
        }
      }

      return user;
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!isLoginPage) {
        window.location.replace('/admin/login.html');
      }
      return null;
    }
  },

  // Đăng nhập Admin
  async login(email, password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Đăng nhập không thành công.');
      }

      const user = data.user || data.data?.user;
      const token = data.token || data.data?.token;

      // KIỂM TRA ROLE ADMIN: Nếu là Customer -> Từ chối truy cập
      if (!user || user.role !== 'admin') {
        throw new Error('Tài khoản này là Khách hàng và không có quyền truy cập trang Quản trị (Admin)!');
      }

      // Lưu trữ phiên đăng nhập Admin
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { user, token };
    } catch (err) {
      throw err;
    }
  },

  // Đăng xuất Admin
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/admin/login.html');
  },

  // Hiển thị thông tin admin trên Header
  renderAdminHeader(user) {
    const nameEl = document.getElementById('header-admin-name');
    const avatarEl = document.getElementById('header-admin-avatar');
    if (nameEl) nameEl.textContent = user.fullName || user.name || 'Quản trị viên';
    if (avatarEl) {
      const initials = (user.fullName || user.name || 'A').charAt(0).toUpperCase();
      avatarEl.textContent = initials;
    }
  },

  // Đánh dấu menu item đang kích hoạt
  highlightActiveMenu() {
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-item');
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && (path.endsWith(href) || (path.endsWith('/admin/') && href.includes('dashboard')))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  },

  // Thiết lập mobile sidebar drawer
  setupMobileDrawer() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    let backdrop = document.querySelector('.sidebar-backdrop');

    if (!backdrop && sidebar) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    if (toggleBtn && sidebar && backdrop) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('active');
      });

      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
      });
    }
  }
};

// Tự động khởi chạy kiểm tra khi load trang
document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = window.location.pathname.endsWith('login.html');
  if (!isLoginPage) {
    adminAuth.checkAuth().then((user) => {
      if (user) {
        adminAuth.renderAdminHeader(user);
        adminAuth.highlightActiveMenu();
        adminAuth.setupMobileDrawer();
      }
    });

    const logoutBtn = document.getElementById('btn-admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        adminModal.confirm({
          title: 'Đăng xuất tài khoản',
          message: 'Bạn có chắc chắn muốn đăng xuất khỏi trang Quản trị?',
          confirmText: 'Đăng xuất',
          isDanger: true,
          onConfirm: () => {
            adminAuth.logout();
          }
        });
      });
    }
  }
});
