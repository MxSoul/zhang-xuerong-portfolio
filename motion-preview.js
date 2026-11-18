(() => {
  const section = document.querySelector('#ai-motion');
  const panel = section.querySelector('#pet-feature');
  const stage = panel.querySelector('.motion-stage');
  const controls = panel.querySelector('.motion-switch');
  const status = panel.querySelector('.motion-status');
  const selectors = section.querySelectorAll('.feature-selector button');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let animate = !reduced.matches;
  let visible = true;
  let frame = null;
  let ready = false;
  let watchdog;
  const origin = location.origin === 'null' ? '*' : location.origin;

  function fail() {
    clearTimeout(watchdog);
    frame?.remove();
    frame = null;
    ready = false;
    animate = false;
    status.textContent = '动效未能加载，可以重试或打开交互演示。';
    update();
  }

  function loadScene() {
    frame = document.createElement('iframe');
    frame.title = '宠物培养实时动效';
    frame.tabIndex = -1;
    frame.src = panel.querySelector('.motion-link').href + '#preview';
    frame.addEventListener('error', fail, { once: true });
    watchdog = setTimeout(fail, 45000);
    stage.append(frame);
  }

  function update() {
    controls.querySelector('[data-mode="motion"]').setAttribute('aria-pressed', String(animate));
    controls.querySelector('[data-mode="still"]').setAttribute('aria-pressed', String(!animate));
    const active = animate && !panel.inert && visible && !document.hidden;
    if (active && !frame) loadScene();
    if (frame) {
      frame.hidden = !animate;
      if (ready) frame.contentWindow.postMessage({type:'pet-preview-active', active}, origin);
    }
  }

  window.addEventListener('message', event => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin) return;
    if (event.data?.type === 'pet-preview-error') return fail();
    if (event.data?.type !== 'pet-preview-ready') return;
    clearTimeout(watchdog);
    ready = true;
    frame.classList.add('is-ready');
    update();
  });

  function selectFeature(panelId) {
    selectors.forEach(button => {
      const id = button.getAttribute('aria-controls');
      const active = id === panelId;
      document.getElementById(id).inert = !active;
      button.setAttribute('aria-pressed', String(active));
    });
    update();
  }

  controls.addEventListener('click', event => {
    const button = event.target.closest('[data-mode]');
    if (!button) return;
    animate = button.dataset.mode === 'motion';
    status.textContent = '';
    update();
  });
  selectors.forEach(button => button.addEventListener('click', () => selectFeature(button.getAttribute('aria-controls'))));
  document.querySelector('nav a[href="#ai-motion"]')?.addEventListener('click', () => selectFeature(panel.id));
  reduced.addEventListener('change', event => { animate = !event.matches; update(); });
  document.addEventListener('visibilitychange', update);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    }).observe(panel.querySelector('.motion-stage'));
  }
  controls.hidden = false;
  update();
})();
