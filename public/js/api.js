/**
 * API Service Client & Storage Helpers
 * Sport Shoes E-Commerce & Inventory Management Platform
 */
const API_BASE_URL = '/api';

const api = {
  // --- Token & Auth state helpers ---
  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token) {
    if (token) localStorage.setItem('token', token);
  },

  removeToken() {
    localStorage.removeItem('token');
  },

  getUser() {
    try {
      const data = localStorage.getItem('currentUser');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  },

  removeUser() {
    localStorage.removeItem('currentUser');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  logout() {
    this.removeToken();
    this.removeUser();
    window.dispatchEvent(new Event('authChange'));
    window.location.href = '/login.html';
  },

  // --- Central HTTP Request Handler ---
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        // Tự động đăng xuất nếu token hết hạn khi gọi endpoint cần xác thực
        if (response.status === 401 && token) {
          console.warn('[API Auth] Phiên đăng nhập hết hạn.');
          // Không tự động redirect nếu đang ở trang login hoặc register
          if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
            this.removeToken();
            this.removeUser();
          }
        }

        const error = new Error(data.message || 'Yêu cầu tới hệ thống thất bại.');
        error.status = response.status;
        error.data = data;
        error.code = data.code;
        error.items = data.items;
        error.errors = data.errors || [];
        throw error;
      }

      return data;
    } catch (error) {
      if (!error.status) {
        console.error(`[API Network Error] ${endpoint}:`, error.message);
      }
      throw error;
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  },

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options
    });
  },

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options
    });
  },

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options
    });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  },

  // --- Wishlist Service (Local Storage Sync) ---
  wishlist: {
    STORAGE_KEY: 'sport_shoes_wishlist',
    get() {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },
    has(productId) {
      const list = this.get();
      return list.some((item) => (item._id || item) === productId);
    },
    toggle(product) {
      const list = this.get();
      const id = product._id || product;
      const index = list.findIndex((item) => (item._id || item) === id);
      let isAdded = false;

      if (index > -1) {
        list.splice(index, 1);
        isAdded = false;
      } else {
        list.push(product);
        isAdded = true;
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('wishlistChange'));
      return isAdded;
    },
    remove(productId) {
      const list = this.get().filter((item) => (item._id || item) !== productId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('wishlistChange'));
    },
    count() {
      return this.get().length;
    }
  },

  // --- Cart Count Helper ---
  async getCartCount() {
    if (!this.isLoggedIn()) return 0;
    try {
      const res = await this.get('/cart');
      if (res.success && res.data && res.data.items) {
        return res.data.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      }
      return 0;
    } catch (e) {
      return 0;
    }
  },

  // --- Currency Formatter ---
  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  }
};

window.api = api;
