/**
 * MAIN FRONTEND CONTROLLER & GLOBAL UI UTILITIES
 * Sport Shoes E-Commerce & Inventory Management Platform
 */

// Toast Notifications System
const toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(type = 'info', title = '', message = '', duration = 4000) {
    this.init();

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;

    const tags = {
      success: 'Thành công',
      error: 'Lỗi',
      warning: 'Cảnh báo',
      info: 'Thông báo'
    };

    toastEl.innerHTML = `
      <div class="toast-content">
        <div class="toast-title"><span class="badge ${type === 'error' ? 'badge-out-of-stock' : type === 'warning' ? 'badge-low-stock' : 'badge-in-stock'}">${tags[type] || 'Thông báo'}</span> ${title ? title : ''}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    toastEl.querySelector('.toast-close').addEventListener('click', () => {
      toastEl.classList.add('hide');
      setTimeout(() => toastEl.remove(), 250);
    });

    this.container.appendChild(toastEl);

    if (duration > 0) {
      setTimeout(() => {
        if (toastEl.parentElement) {
          toastEl.classList.add('hide');
          setTimeout(() => toastEl.remove(), 250);
        }
      }, duration);
    }
  },

  success(msg, title = 'Thành công') {
    this.show('success', title, msg);
  },

  error(msg, title = 'Đã có lỗi xảy ra') {
    this.show('error', title, msg);
  },

  warning(msg, title = 'Lưu ý') {
    this.show('warning', title, msg);
  },

  info(msg, title = 'Thông báo') {
    this.show('info', title, msg);
  }
};

window.toast = toast;

// Modal Dialog Utility
const modal = {
  confirm({ title = 'Xác nhận', message = '', confirmText = 'Đồng ý', cancelText = 'Hủy' }) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay show';
      overlay.innerHTML = `
        <div class="modal-box">
          <div class="modal-header">
            <h3>${title}</h3>
            <button class="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body">${message}</div>
          <div class="modal-footer">
            <button class="btn btn-secondary modal-cancel-btn">${cancelText}</button>
            <button class="btn btn-primary modal-confirm-btn">${confirmText}</button>
          </div>
        </div>
      `;

      const cleanup = (result) => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 200);
        resolve(result);
      };

      overlay.querySelector('.modal-close-btn').onclick = () => cleanup(false);
      overlay.querySelector('.modal-cancel-btn').onclick = () => cleanup(false);
      overlay.querySelector('.modal-confirm-btn').onclick = () => cleanup(true);
      overlay.onclick = (e) => {
        if (e.target === overlay) cleanup(false);
      };

      document.body.appendChild(overlay);
    });
  }
};

window.modal = modal;

// Document Ready Initialization
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  updateBadges();

  // Lắng nghe sự kiện thay đổi auth hoặc giỏ hàng/wishlist
  window.addEventListener('authChange', () => {
    initNavbar();
    updateBadges();
  });

  window.addEventListener('wishlistChange', updateBadges);
  window.addEventListener('cartChange', updateBadges);
});

/**
 * Cập nhật trạng thái hiển thị của Navbar (User menu, Login/Register buttons)
 */
function initNavbar() {
  const userActions = document.getElementById('nav-user-actions');
  const user = window.api.getUser();
  const token = window.api.getToken();

  if (userActions) {
    if (token && user) {
      userActions.innerHTML = `
        <div class="user-menu-wrapper">
          <button class="nav-text-btn" id="btn-user-menu" title="${user.fullName || user.name || 'Tài khoản'}">
            ${user.fullName || user.name || 'Tài khoản'}
          </button>
          <div class="user-dropdown" id="user-dropdown-menu">
            <div class="user-dropdown-header">
              <div class="user-name">${user.fullName || user.name || 'Khách hàng'}</div>
              <div class="user-email">${user.email}</div>
            </div>
            <a href="/profile.html">Hồ sơ cá nhân</a>
            <a href="/orders.html">Đơn hàng của tôi</a>
            <a href="/wishlist.html">Danh sách yêu thích</a>
            ${user.role === 'admin' ? '<a href="/admin" style="color: var(--color-accent); font-weight: 700;">Quản trị Admin</a>' : ''}
            <button class="logout-btn" id="btn-logout">Đăng xuất</button>
          </div>
        </div>
      `;

      // Toggle dropdown menu
      const btnUser = document.getElementById('btn-user-menu');
      const dropdown = document.getElementById('user-dropdown-menu');
      const btnLogout = document.getElementById('btn-logout');

      if (btnUser && dropdown) {
        btnUser.onclick = (e) => {
          e.stopPropagation();
          dropdown.classList.toggle('show');
        };

        document.addEventListener('click', () => {
          dropdown.classList.remove('show');
        });
      }

      if (btnLogout) {
        btnLogout.onclick = () => {
          window.api.logout();
        };
      }
    } else {
      userActions.innerHTML = `
        <a href="/login.html" class="btn btn-outline btn-sm">Đăng nhập</a>
        <a href="/register.html" class="btn btn-primary btn-sm">Đăng ký</a>
      `;
    }
  }

  // Header Search Input submission
  const navSearchForm = document.getElementById('nav-search-form');
  const navSearchInput = document.getElementById('nav-search-input');
  if (navSearchForm && navSearchInput) {
    navSearchForm.onsubmit = (e) => {
      e.preventDefault();
      const query = navSearchInput.value.trim();
      if (query) {
        window.location.href = `/products.html?search=${encodeURIComponent(query)}`;
      }
    };
  }

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const navLinks = document.getElementById('nav-main-links');
  if (mobileToggle && navLinks) {
    mobileToggle.onclick = () => {
      navLinks.classList.toggle('open');
    };
  }
}

/**
 * Cập nhật số lượng hiển thị trên Badge Giỏ hàng và Wishlist
 */
async function updateBadges() {
  const cartBadge = document.getElementById('nav-cart-badge');
  const wishlistBadge = document.getElementById('nav-wishlist-badge');

  if (wishlistBadge) {
    const count = window.api.wishlist.count();
    wishlistBadge.textContent = count;
    wishlistBadge.style.display = count > 0 ? 'flex' : 'none';
  }

  if (cartBadge) {
    if (window.api.isLoggedIn()) {
      try {
        const count = await window.api.getCartCount();
        cartBadge.textContent = count;
        cartBadge.style.display = count > 0 ? 'flex' : 'none';
      } catch (e) {
        cartBadge.style.display = 'none';
      }
    } else {
      cartBadge.style.display = 'none';
    }
  }
}
