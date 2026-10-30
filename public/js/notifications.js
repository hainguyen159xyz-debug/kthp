(() => {
  const storageKey = 'sportzone-notifications';
  const active = new Map();
  let container;
  const save = () => {
    try { sessionStorage.setItem(storageKey, JSON.stringify([...active.values()].map(item => item.data))); } catch (_) {}
  };
  const init = () => {
    if (container) return;
    container = document.createElement('div');
    container.className = 'notification-banner-stack';
    container.setAttribute('aria-label', 'Thông báo');
    document.body.append(container);
  };
  function show({ type = 'info', title = '', message = '', duration = 8000, expiresAt, id } = {}) {
    init();
    const data = { id: id || `${Date.now()}-${Math.random()}`, type, title, message, expiresAt: expiresAt ?? (duration > 0 ? Date.now() + duration : null) };
    if (data.expiresAt && data.expiresAt <= Date.now()) return;
    const banner = document.createElement('div');
    banner.className = `notification-banner notification-banner-${type}`;
    banner.setAttribute('role', type === 'error' ? 'alert' : 'status');
    banner.innerHTML = '<span class="notification-banner-icon" aria-hidden="true"></span><div class="notification-banner-copy"><strong></strong><span></span></div><button type="button" class="notification-banner-close" aria-label="Đóng thông báo">&times;</button>';
    banner.querySelector('.notification-banner-icon').textContent = { success: '✓', error: '!', warning: '!', info: 'i' }[type] || 'i';
    banner.querySelector('strong').textContent = title || { success: 'Thành công', error: 'Có lỗi xảy ra', warning: 'Lưu ý', info: 'Thông báo' }[type] || 'Thông báo';
    banner.querySelector('.notification-banner-copy span').textContent = message;
    let timer;
    const dismiss = () => {
      clearTimeout(timer);
      active.delete(data.id);
      save();
      banner.remove();
    };
    const schedule = () => {
      clearTimeout(timer);
      if (data.expiresAt) timer = setTimeout(dismiss, Math.max(0, data.expiresAt - Date.now()));
    };
    let remaining;
    const pause = () => {
      if (!data.expiresAt) return;
      remaining = Math.max(0, data.expiresAt - Date.now());
      clearTimeout(timer);
    };
    const resume = () => {
      if (remaining === undefined || banner.matches(':hover') || banner.contains(document.activeElement)) return;
      data.expiresAt = Date.now() + remaining;
      remaining = undefined;
      save();
      schedule();
    };
    banner.addEventListener('mouseenter', pause);
    banner.addEventListener('mouseleave', resume);
    banner.addEventListener('focusin', pause);
    banner.addEventListener('focusout', () => setTimeout(resume, 0));
    banner.querySelector('button').addEventListener('click', dismiss);
    active.set(data.id, { data, dismiss });
    container.append(banner);
    if (active.size > 3) active.values().next().value.dismiss();
    save();
    schedule();
  }
  window.notifications = { show };
  document.addEventListener('DOMContentLoaded', () => {
    let saved = [];
    try { saved = JSON.parse(sessionStorage.getItem(storageKey) || '[]'); } catch (_) {}
    if (Array.isArray(saved)) saved.slice(-3).forEach(item => { if (!active.has(item.id)) show(item); });
  });
})();
