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

  show(type = 'info', title = '', message = '', duration = 8000) {
    window.notifications.show({ type, title, message, duration });
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
      // 1. Trạng thái ĐÃ ĐĂNG NHẬP: Hiển thị biểu tượng tài khoản kèm menu cá nhân
      userActions.innerHTML = `
        <div class="user-menu-wrapper" id="nav-user-menu-wrapper">
          <button class="nav-icon-btn" id="btn-user-menu" title="${user.fullName || user.name || 'Tài khoản'}" aria-label="Tài khoản khách hàng" aria-haspopup="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
          <div class="user-dropdown" id="user-dropdown-menu">
            <div class="user-dropdown-header">
              <div class="user-name">${user.fullName || user.name || 'Khách hàng'}</div>
              <div class="user-email">${user.email}</div>
            </div>
            <a href="/profile.html" id="menu-link-profile">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Hồ sơ cá nhân
            </a>
            <a href="/orders.html" id="menu-link-orders">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              Đơn hàng của tôi
            </a>
            <a href="/wishlist.html" id="menu-link-wishlist">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              Danh sách yêu thích
            </a>
            <button class="logout-btn" id="btn-logout" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      `;
    } else {
      // 2. Trạng thái CHƯA ĐĂNG NHẬP: Chỉ hiển thị biểu tượng tài khoản, click mở dropdown Đăng nhập / Đăng ký
      userActions.innerHTML = `
        <div class="user-menu-wrapper" id="nav-user-menu-wrapper">
          <button class="nav-icon-btn" id="btn-user-menu" title="Tài khoản" aria-label="Tài khoản" aria-haspopup="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
          <div class="user-dropdown" id="user-dropdown-menu">
            <div class="user-dropdown-header">
              <div class="user-name">Tài khoản</div>
              <div class="user-email">Chào mừng bạn đến với SportZone</div>
            </div>
            <a href="/login.html" id="menu-link-login">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Đăng nhập
            </a>
            <a href="/register.html" id="menu-link-register">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              Đăng ký
            </a>
          </div>
        </div>
      `;
    }

    // Toggle dropdown menu
    const btnUser = document.getElementById('btn-user-menu');
    const dropdown = document.getElementById('user-dropdown-menu');
    const btnLogout = document.getElementById('btn-logout');

    if (btnUser && dropdown) {
      btnUser.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      };

      document.addEventListener('click', (e) => {
        if (!e.target.closest('#nav-user-menu-wrapper')) {
          dropdown.classList.remove('show');
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          dropdown.classList.remove('show');
        }
      });
    }

    if (btnLogout) {
      btnLogout.onclick = () => {
        window.api.logout();
      };
    }
  }

  // Header Search Input submission
  const navSearchForm = document.getElementById('nav-search-form');
  const navSearchInput = document.getElementById('nav-search-input');
  if (navSearchForm && navSearchInput) {
    if (!window.location.pathname.endsWith('products.html')) {
      navSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = navSearchInput.value.trim();
        window.location.href = query ? `/products.html?search=${encodeURIComponent(query)}` : '/products.html';
      });
    }
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
