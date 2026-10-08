/**
 * ==========================================================================
 * SPORTZONE ADMIN - CENTRALIZED API CLIENT & UI UTILITIES
 * ==========================================================================
 */

const API_BASE = '/api';

// Toast Notification Manager
const adminToast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', title = '') {
    this.init();

    const toast = document.createElement('div');
    toast.className = `admin-toast toast-${type}`;

    let tag = 'THÔNG BÁO';
    let defaultTitle = 'Thông báo';
    if (type === 'success') {
      tag = 'THÀNH CÔNG';
      defaultTitle = 'Thành công';
    } else if (type === 'error') {
      tag = 'LỖI';
      defaultTitle = 'Lỗi hệ thống';
    } else if (type === 'warning') {
      tag = 'CẢNH BÁO';
      defaultTitle = 'Cảnh báo';
    }

    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title"><span class="badge ${type === 'error' ? 'badge-danger' : type === 'warning' ? 'badge-warning' : 'badge-success'}">${tag}</span> ${title || defaultTitle}</div>
        <div class="toast-msg">${message}</div>
      </div>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  success(msg, title = 'Thành công') {
    this.show(msg, 'success', title);
  },

  error(msg, title = 'Đã có lỗi') {
    this.show(msg, 'error', title);
  },

  warning(msg, title = 'Cảnh báo') {
    this.show(msg, 'warning', title);
  },

  info(msg, title = 'Thông tin') {
    this.show(msg, 'info', title);
  }
};

// Modal & Confirmation Manager
const adminModal = {
  open(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
  },

  close(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
  },

  confirm({ title = 'Xác nhận thao tác', message = 'Bạn có chắc chắn muốn thực hiện hành động này?', confirmText = 'Đồng ý', cancelText = 'Hủy bỏ', isDanger = false, onConfirm }) {
    let confirmModal = document.getElementById('admin-confirm-modal');
    if (!confirmModal) {
      confirmModal = document.createElement('div');
      confirmModal.id = 'admin-confirm-modal';
      confirmModal.className = 'modal-overlay';
      confirmModal.innerHTML = `
        <div class="modal-box modal-sm">
          <div class="modal-header">
            <h3 class="modal-title" id="confirm-modal-title">Xác nhận</h3>
            <button class="modal-close" onclick="adminModal.close('admin-confirm-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <p id="confirm-modal-message" style="color: var(--text-muted); font-size: 0.92rem;"></p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" id="confirm-modal-cancel">Hủy</button>
            <button class="btn btn-sm" id="confirm-modal-ok">Đồng ý</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmModal);
    }

    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-message').textContent = message;

    const okBtn = document.getElementById('confirm-modal-ok');
    const cancelBtn = document.getElementById('confirm-modal-cancel');

    okBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    if (isDanger) {
      okBtn.className = 'btn btn-danger btn-sm';
    } else {
      okBtn.className = 'btn btn-primary btn-sm';
    }

    const handleOk = () => {
      adminModal.close('admin-confirm-modal');
      okBtn.removeEventListener('click', handleOk);
      cancelBtn.removeEventListener('click', handleCancel);
      if (typeof onConfirm === 'function') onConfirm();
    };

    const handleCancel = () => {
      adminModal.close('admin-confirm-modal');
      okBtn.removeEventListener('click', handleOk);
      cancelBtn.removeEventListener('click', handleCancel);
    };

    okBtn.onclick = handleOk;
    cancelBtn.onclick = handleCancel;

    this.open('admin-confirm-modal');
  }
};

// Admin Centralized HTTP API Client
const adminApi = {
  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token) {
    localStorage.setItem('token', token);
  },

  removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      // Bắt lỗi xác thực 401
      if (response.status === 401) {
        this.removeToken();
        adminToast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'Phiên làm việc kết thúc');
        setTimeout(() => {
          window.location.href = '/admin/login.html';
        }, 1200);
        throw new Error('Unauthorized');
      }

      // Bắt lỗi phân quyền 403
      if (response.status === 403) {
        adminToast.error(data.message || 'Bạn không có quyền quản trị để thực hiện hành động này.', 'Truy cập bị từ chối');
        throw new Error(data.message || 'Forbidden');
      }

      if (!response.ok) {
        const errorMsg = data.message || (data.errors ? data.errors.join(', ') : 'Yêu cầu không thành công.');
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.error(`[Admin API Error] ${endpoint}:`, err);
      throw err;
    }
  },

  get(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    const queryString = query.toString();
    const fullUrl = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(fullUrl, { method: 'GET' });
  },

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  patch(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

// Utilities formatting
function formatCurrency(amount) {
  if (typeof amount !== 'number') amount = Number(amount) || 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${d.toLocaleDateString('vi-VN')}`;
}
