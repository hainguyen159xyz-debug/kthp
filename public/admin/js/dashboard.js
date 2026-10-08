/**
 * ==========================================================================
 * SPORTZONE ADMIN - DASHBOARD CONTROLLER
 * ==========================================================================
 */

let revenueChartInstance = null;
let categoryChartInstance = null;

async function loadDashboardData() {
  try {
    const res = await adminApi.get('/dashboard/stats');
    if (!res || !res.success || !res.data) {
      throw new Error('Không thể lấy dữ liệu thống kê từ máy chủ.');
    }

    const { financials, orders, users, inventory, topProducts, recentOrders, revenueTrends, categoryDistribution } = res.data;

    // 1. Cập nhật 8 KPI Cards
    document.getElementById('kpi-total-revenue').textContent = formatCurrency(financials.totalRevenue || 0);
    document.getElementById('kpi-total-orders').textContent = (orders.totalOrders || 0).toLocaleString('vi-VN');
    document.getElementById('kpi-today-orders').textContent = (orders.todayOrders || 0).toLocaleString('vi-VN');
    document.getElementById('kpi-processing-orders').textContent = (orders.processingOrders || 0).toLocaleString('vi-VN');
    document.getElementById('kpi-waiting-sub').textContent = `${orders.waitingSupplierOrders || 0} đơn đang chờ NCC`;

    document.getElementById('kpi-total-customers').textContent = (users.totalCustomers || 0).toLocaleString('vi-VN');
    document.getElementById('kpi-total-products').textContent = (inventory.totalProducts || 0).toLocaleString('vi-VN');
    document.getElementById('kpi-low-stock').textContent = (inventory.lowStockCount || 0).toLocaleString('vi-VN');
    document.getElementById('kpi-out-of-stock').textContent = (inventory.outOfStockCount || 0).toLocaleString('vi-VN');

    // 2. Vẽ Biểu đồ 1: Doanh thu & Đơn hàng 7 ngày
    renderRevenueTrendChart(revenueTrends || []);

    // 3. Vẽ Biểu đồ 2: Danh mục sản phẩm
    renderCategoryChart(categoryDistribution || []);

    // 4. Bảng Top Sản phẩm bán chạy
    renderTopProductsTable(topProducts || []);

    // 5. Bảng Cảnh báo tồn kho JIT
    renderLowStockAlerts(inventory.lowStockAlerts || []);

    // 6. Bảng Đơn hàng mới nhất
    renderRecentOrders(recentOrders || []);

  } catch (err) {
    console.error('Lỗi tải Dashboard:', err);
    adminToast.error(err.message || 'Không thể tải dữ liệu Dashboard.', 'Lỗi nạp dữ liệu');
  }
}

// Render Revenue Trend Chart (Chart.js)
function renderRevenueTrendChart(trends) {
  const ctx = document.getElementById('chart-revenue-trend');
  if (!ctx) return;

  if (revenueChartInstance) {
    revenueChartInstance.destroy();
  }

  const labels = trends.map((t) => t.label || t.date);
  const revenues = trends.map((t) => t.revenue || 0);
  const orders = trends.map((t) => t.orders || 0);

  revenueChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Doanh thu (₫)',
          data: revenues,
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: '#6366f1',
          borderWidth: 1.5,
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Số đơn hàng',
          data: orders,
          type: 'line',
          borderColor: '#10b981',
          backgroundColor: '#10b981',
          borderWidth: 2.5,
          pointRadius: 4,
          tension: 0.3,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12 } }
        },
        tooltip: {
          backgroundColor: '#17223b',
          titleColor: '#fff',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          callbacks: {
            label: function (context) {
              if (context.dataset.label.includes('Doanh thu')) {
                return `Doanh thu: ${formatCurrency(context.parsed.y)}`;
              }
              return `Đơn hàng: ${context.parsed.y} đơn`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#94a3b8' }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: {
            color: '#94a3b8',
            callback: function (val) {
              if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
              if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
              return val;
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#10b981', precision: 0 }
        }
      }
    }
  });
}

// Render Category Doughnut Chart
function renderCategoryChart(categories) {
  const ctx = document.getElementById('chart-category-dist');
  if (!ctx) return;

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  const labels = categories.map((c) => c.name);
  const data = categories.map((c) => c.count);
  const colors = [
    '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'
  ];

  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#131c31'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 }, boxWidth: 12 }
        }
      },
      cutout: '65%'
    }
  });
}

// Render Top Products Table
function renderTopProductsTable(products) {
  const tbody = document.getElementById('top-products-table');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 24px;">Chưa có sản phẩm nào bán ra</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map((p) => {
    const imgUrl = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100';
    return `
      <tr>
        <td>
          <div class="table-product-cell">
            <img src="${imgUrl}" alt="${p.name}" class="table-product-thumb" onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100'">
            <div class="table-product-info">
              <span class="table-product-name">${p.name}</span>
            </div>
          </div>
        </td>
        <td><strong style="color: #60a5fa;">${p.totalSold || 0}</strong> đôi</td>
        <td>
          <span class="badge ${p.stock > 5 ? 'badge-success' : (p.stock > 0 ? 'badge-warning' : 'badge-danger')}">
            ${p.stock || 0} đôi
          </span>
        </td>
        <td><strong>${formatCurrency(p.salePrice || 0)}</strong></td>
      </tr>
    `;
  }).join('');
}

// Render Low Stock Alerts Table
function renderLowStockAlerts(alerts) {
  const tbody = document.getElementById('low-stock-table');
  if (!tbody) return;

  if (alerts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--success); padding: 24px;">✓ Kho hàng ổn định, không có biến thể chạm ngưỡng cảnh báo</td></tr>`;
    return;
  }

  tbody.innerHTML = alerts.map((a) => {
    const isOut = a.stockQuantity === 0;
    return `
      <tr>
        <td>
          <strong style="color: #fff;">${a.productName}</strong>
          <div style="font-size: 0.75rem; color: var(--text-dim); font-family: monospace;">${a.sku || 'N/A'}</div>
        </td>
        <td>
          <span class="badge badge-neutral">Size ${a.size}</span>
          <span class="badge badge-neutral">${a.color}</span>
        </td>
        <td>
          <span class="badge ${isOut ? 'badge-danger' : 'badge-warning'}">
            ${a.stockQuantity} / Ngưỡng: ${a.threshold}
          </span>
        </td>
        <td>
          <a href="/admin/purchase-orders.html" class="btn btn-secondary btn-sm" title="Tạo phiếu nhập hàng">
            + Nhập NCC
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

// Render Recent Orders Table
function renderRecentOrders(orders) {
  const tbody = document.getElementById('recent-orders-table');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 24px;">Chưa có đơn hàng nào trong hệ thống</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map((o) => {
    const statusMap = {
      pending: { label: 'Chờ xác nhận', badge: 'badge-warning' },
      processing: { label: 'Đang xử lý', badge: 'badge-info' },
      shipping: { label: 'Đang giao', badge: 'badge-purple' },
      completed: { label: 'Hoàn tất', badge: 'badge-success' },
      delivered: { label: 'Đã giao', badge: 'badge-success' },
      cancelled: { label: 'Đã hủy', badge: 'badge-danger' }
    };

    const st = statusMap[o.orderStatus || o.status] || { label: o.orderStatus || o.status, badge: 'badge-neutral' };
    const customerName = o.user?.fullName || o.customer?.fullName || o.user?.name || o.customer?.name || 'Khách vãng lai';

    return `
      <tr>
        <td><strong><code>${o.orderCode || o._id.slice(-6).toUpperCase()}</code></strong></td>
        <td>
          <div>${customerName}</div>
          <div style="font-size: 0.75rem; color: var(--text-dim);">${o.user?.email || o.customer?.email || ''}</div>
        </td>
        <td>${formatDateTime(o.createdAt)}</td>
        <td><strong style="color: #34d399;">${formatCurrency(o.totalAmount || 0)}</strong></td>
        <td><span class="badge ${st.badge}">${st.label}</span></td>
        <td>
          <a href="/admin/order-detail.html?id=${o._id}" class="btn btn-secondary btn-sm">
            Chi tiết
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();

  const refreshBtn = document.getElementById('btn-refresh-dashboard');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      adminToast.info('Đang làm mới dữ liệu từ MongoDB...', 'Cập nhật');
      loadDashboardData();
    });
  }
});
