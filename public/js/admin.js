document.addEventListener('DOMContentLoaded', async () => {
  const kpiRevenue = document.getElementById('kpi-revenue');
  const kpiCost = document.getElementById('kpi-cost');
  const kpiProfit = document.getElementById('kpi-profit');
  const kpiWaiting = document.getElementById('kpi-waiting-orders');
  const badgeLowStock = document.getElementById('badge-low-stock-count');
  const tableBody = document.getElementById('low-stock-table-body');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  try {
    const res = await window.api.get('/dashboard/stats');
    if (res.success && res.data) {
      const { financials, orders, inventory } = res.data;

      if (kpiRevenue) kpiRevenue.textContent = formatCurrency(financials.totalRevenue);
      if (kpiCost) kpiCost.textContent = formatCurrency(financials.totalImportCost);
      if (kpiProfit) kpiProfit.textContent = formatCurrency(financials.estimatedGrossProfit);
      if (kpiWaiting) kpiWaiting.textContent = orders.waitingSupplierOrders || 0;
      if (badgeLowStock) badgeLowStock.textContent = `${inventory.lowStockCount || 0} mặt hàng`;

      if (inventory.lowStockAlerts && inventory.lowStockAlerts.length > 0 && tableBody) {
        tableBody.innerHTML = inventory.lowStockAlerts
          .map((item) => `
            <tr>
              <td><strong>${item.productName}</strong></td>
              <td><code>${item.sku}</code></td>
              <td>Size ${item.size}</td>
              <td>${item.color}</td>
              <td><span style="color: var(--color-danger); font-weight: 700;">${item.stockQuantity}</span> (Ngưỡng: ${item.threshold})</td>
              <td>${item.isFastMoving ? '<span class="badge badge-in-stock">Bán chạy</span>' : '<span class="badge badge-backorder">Bán chậm/JIT</span>'}</td>
              <td>
                <button class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.8rem;" onclick="alert('Tính năng tạo nhanh phiếu nhập PO cho mã: ' + '${item.sku}')">
                  + Tạo Phiếu Nhập
                </button>
              </td>
            </tr>
          `)
          .join('');
      }
    }
  } catch (error) {
    // Nếu chưa đăng nhập Admin hoặc CSDL chưa có dữ liệu, hiển thị trạng thái hướng dẫn
    console.log('[Admin Dashboard Notice]: Cần token quyền Admin hoặc CSDL đang trống.', error.message);
  }
});
