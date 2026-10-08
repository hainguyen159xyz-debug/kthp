document.addEventListener('DOMContentLoaded', async () => {
  const statusElement = document.getElementById('api-status');
  const serverTimeElement = document.getElementById('server-time');

  try {
    const res = await window.api.get('/health');
    if (res.success) {
      if (statusElement) {
        statusElement.textContent = 'REST API Hoạt động bình thường (Online)';
        statusElement.style.color = 'var(--color-success)';
      }
      if (serverTimeElement) {
        serverTimeElement.textContent = `Thời gian hệ thống: ${new Date(res.timestamp).toLocaleString('vi-VN')}`;
      }
    }
  } catch (error) {
    if (statusElement) {
      statusElement.textContent = 'Chưa thể kết nối tới Backend API';
      statusElement.style.color = 'var(--color-danger)';
    }
  }
});
