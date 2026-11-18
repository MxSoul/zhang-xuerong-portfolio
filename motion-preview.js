(() => {
  const section = document.getElementById('ai-motion');
  const stage = section.querySelector('.motion-stage');
  const modes = section.querySelector('.motion-switch');
  const status = section.querySelector('.motion-status');
  const demoUrl = section.querySelector('.motion-link').href;
  let frame;
  let timeout;

  function select(mode) {
    for (const button of modes.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    }
  }

  function showStill(message = '') {
    clearTimeout(timeout);
    frame?.remove();
    frame = null;
    select('still');
    status.textContent = message;
  }

  function loadFailed() {
    showStill('动效未能加载，可以重试，或打开完整演示。');
  }

  modes.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.mode === 'still') return showStill();
    if (frame) return;
    select('motion');
    status.textContent = '正在加载动效…';
    frame = document.createElement('iframe');
    frame.title = '宠物培养动效预览';
    frame.tabIndex = -1;
    frame.src = demoUrl + '#preview';
    frame.addEventListener('error', loadFailed, { once: true });
    timeout = setTimeout(loadFailed, 45000);
    stage.append(frame);
  });

  window.addEventListener('message', event => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin) return;
    if (event.data?.type === 'pet-preview-error') return loadFailed();
    if (event.data?.type !== 'pet-preview-ready') return;
    clearTimeout(timeout);
    frame.classList.add('is-ready');
    status.textContent = '';
  });

  modes.hidden = false;
})();
