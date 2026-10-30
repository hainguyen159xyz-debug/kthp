document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input[type="password"]').forEach((input) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'password-field';
    input.before(wrapper);
    wrapper.append(input);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'password-visibility-toggle';
    button.setAttribute('aria-controls', input.id);
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="password-eye-slash" d="m3 3 18 18" hidden/></svg>';
    const label = input.labels?.[0]?.textContent.replace(/\s*\*\s*$/, '').trim() || 'mật khẩu';
    const update = () => {
      const visible = input.type === 'text';
      const action = `${visible ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`;
      button.setAttribute('aria-label', action);
      button.title = action;
      button.setAttribute('aria-pressed', String(visible));
      button.querySelector('.password-eye-slash').toggleAttribute('hidden', !visible);
    };
    button.addEventListener('click', () => {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      input.type = input.type === 'password' ? 'text' : 'password';
      update();
      input.focus({ preventScroll: true });
      if (start !== null && end !== null) input.setSelectionRange(start, end);
    });
    wrapper.append(button);
    update();
    input.form?.addEventListener('reset', () => {
      input.type = 'password';
      update();
    });
  });
});
