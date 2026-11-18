(() => {
  'use strict';
  const root = document.documentElement;
  const works = window.PORTFOLIO || [];
  const byId = Object.fromEntries(works.map(work => [work.id, work]));
  const groupNames = { jianghu: '热血江湖 · 觉醒', daozai: '刀仔', shediao: '射雕' };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionEnabled = !reducedMotion.matches;
  let particleFrame = 0;
  let particleStart = () => {};
  function updateMotion() {
    root.classList.toggle('motion-off', !motionEnabled);
    cancelAnimationFrame(particleFrame);
    if (motionEnabled) particleStart();
  }
  updateMotion();
  reducedMotion.addEventListener('change', event => { motionEnabled = !event.matches; updateMotion(); });

  if ('IntersectionObserver' in window) {
    root.classList.add('js');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('in-view'); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
  }

  // All artwork remains the original supplied design. The viewer loads full resolution on demand.
  const modal = document.createElement('div');
  modal.className = 'lightbox';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'lightbox-title');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `<div class="lightbox-header"><div><h2 class="lightbox-title" id="lightbox-title"></h2><p class="lightbox-subtitle"></p></div><div class="lightbox-controls"><a class="lightbox-original" target="_blank" rel="noopener">打开原图 ↗</a><button class="lightbox-zoom" type="button" aria-label="放大图片" aria-pressed="false">+</button><button class="lightbox-close" type="button" aria-label="关闭图片预览">×</button></div></div><button class="lightbox-arrow lightbox-prev" type="button" aria-label="上一张作品">←</button><div class="lightbox-viewport"><img class="lightbox-image" alt=""></div><button class="lightbox-arrow lightbox-next" type="button" aria-label="下一张作品">→</button><div class="lightbox-bottom"><span></span><span class="lightbox-counter" aria-live="polite"></span><span>← → 切换 &nbsp; · &nbsp; Esc 关闭</span></div>`;
  document.body.append(modal);
  const viewport = modal.querySelector('.lightbox-viewport');
  const viewerImage = modal.querySelector('.lightbox-image');
  const zoomButton = modal.querySelector('.lightbox-zoom');
  let galleryIds = [], galleryIndex = 0, returnFocus = null, inertElements = [];
  let touchStart = null;
  function resetZoom() {
    viewport.classList.remove('zoomed');
    zoomButton.setAttribute('aria-pressed', 'false');
    zoomButton.setAttribute('aria-label', '放大图片');
    zoomButton.textContent = '+';
    viewport.scrollTo(0, 0);
  }
  function showArtwork() {
    const work = byId[galleryIds[galleryIndex]];
    if (!work) return;
    resetZoom();
    viewerImage.src = work.image;
    viewerImage.alt = `${work.title}，${work.description}`;
    modal.querySelector('.lightbox-title').textContent = work.title;
    modal.querySelector('.lightbox-subtitle').textContent = `${groupNames[work.group]} / ${work.description}`;
    modal.querySelector('.lightbox-counter').textContent = `${String(galleryIndex + 1).padStart(2, '0')} / ${String(galleryIds.length).padStart(2, '0')}`;
    modal.querySelector('.lightbox-original').href = work.image;
  }
  function openArtwork(id, trigger) {
    const cards = document.querySelectorAll('.work-card [data-art], .feature-panel [data-art]');
    const visibleIds = Array.from(cards, item => item.dataset.art);
    galleryIds = [...new Set(visibleIds.includes(id) ? visibleIds : [id, ...visibleIds])];
    galleryIndex = galleryIds.indexOf(id);
    returnFocus = trigger;
    showArtwork();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    inertElements = [...document.body.children].filter(el => el !== modal && el.tagName !== 'SCRIPT' && !el.inert);
    inertElements.forEach(el => { el.inert = true; });
    modal.querySelector('.lightbox-close').focus();
  }
  function closeArtwork() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    inertElements.forEach(el => { el.inert = false; });
    inertElements = [];
    returnFocus?.focus({ preventScroll: true });
  }
  function moveArtwork(direction) { galleryIndex = (galleryIndex + direction + galleryIds.length) % galleryIds.length; showArtwork(); }
  function toggleZoom() {
    const zoomed = !viewport.classList.contains('zoomed');
    if (zoomed) {
      const width = viewerImage.getBoundingClientRect().width;
      viewerImage.style.setProperty('--zoom-width', `${Math.max(width * 2, Math.min(viewerImage.naturalWidth, 1800))}px`);
    }
    viewport.classList.toggle('zoomed', zoomed);
    zoomButton.setAttribute('aria-pressed', String(zoomed));
    zoomButton.setAttribute('aria-label', zoomed ? '还原图片大小' : '放大图片');
    zoomButton.textContent = zoomed ? '−' : '+';
    if (!zoomed) viewport.scrollTo(0, 0);
  }
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-art]');
    if (trigger && byId[trigger.dataset.art]) openArtwork(trigger.dataset.art, trigger);
  });
  modal.querySelector('.lightbox-close').addEventListener('click', closeArtwork);
  modal.querySelector('.lightbox-prev').addEventListener('click', () => moveArtwork(-1));
  modal.querySelector('.lightbox-next').addEventListener('click', () => moveArtwork(1));
  zoomButton.addEventListener('click', toggleZoom);
  viewerImage.addEventListener('click', toggleZoom);
  modal.addEventListener('click', event => { if (event.target === modal || event.target === viewport) closeArtwork(); });
  viewport.addEventListener('touchstart', event => {
    if (event.touches.length === 1 && !viewport.classList.contains('zoomed')) touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  viewport.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x, dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) moveArtwork(dx > 0 ? -1 : 1);
    touchStart = null;
  }, { passive: true });
  document.addEventListener('keydown', event => {
    if (!modal.classList.contains('open')) return;
    if (event.key === 'Escape') closeArtwork();
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveArtwork(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); moveArtwork(1); }
    if (event.key === 'Tab') {
      const focusable = [...modal.querySelectorAll('button, a[href]')].filter(el => el.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  const finePointer = window.matchMedia('(pointer: fine)');
  document.querySelectorAll('.magnetic').forEach(button => {
    button.addEventListener('pointermove', event => {
      if (!motionEnabled || !finePointer.matches) return;
      const rect = button.getBoundingClientRect();
      button.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .12}px, ${(event.clientY - rect.top - rect.height / 2) * .2}px)`;
    });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });

  const progress = document.querySelector('.reading-progress');
  const topButton = document.querySelector('.back-to-top');
  let scrollQueued = false;
  function updateScroll() {
    const distance = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${distance > 0 ? Math.min(100, scrollY / distance * 100) : 0}%`;
    topButton?.classList.toggle('visible', scrollY > 700);
    scrollQueued = false;
  }
  addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  updateScroll();
  topButton?.addEventListener('click', () => scrollTo({ top: 0, behavior: motionEnabled ? 'smooth' : 'instant' }));
  const caseSections = [...document.querySelectorAll('.case-section')];
  if (caseSections.length && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        document.querySelectorAll('.case-nav a').forEach(link => {
          const active = link.hash === `#${entry.target.id}`;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
        });
      }
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    caseSections.forEach(section => sectionObserver.observe(section));
  }

  // Lightweight decorative particles only run while the hero is on screen.
  const canvas = document.querySelector('#particles');
  if (canvas) {
    const context = canvas.getContext('2d');
    const hero = document.querySelector('.hero');
    let width = 0, height = 0, visible = true, lastTime = 0;
    const particles = Array.from({ length: 23 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.1 + .35, speed: .003 + Math.random() * .007, phase: Math.random() * 6.28 }));
    function resize() {
      width = hero.clientWidth; height = hero.clientHeight;
      const dpr = Math.min(devicePixelRatio, 1.5);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      context?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(time) {
      if (!motionEnabled || !visible || document.hidden || !context) return;
      const delta = Math.min((time - lastTime) / 1000, .05); lastTime = time;
      context.clearRect(0, 0, width, height);
      for (const particle of particles) {
        particle.y -= particle.speed * delta;
        if (particle.y < 0) particle.y = 1;
        context.beginPath();
        context.arc(particle.x * width + Math.sin(time / 5000 + particle.phase) * 13, particle.y * height, particle.r, 0, Math.PI * 2);
        context.fillStyle = 'rgba(190,214,146,.3)'; context.fill();
      }
      particleFrame = requestAnimationFrame(draw);
    }
    particleStart = () => { cancelAnimationFrame(particleFrame); lastTime = performance.now(); if (visible && motionEnabled && !document.hidden) particleFrame = requestAnimationFrame(draw); };
    resize();
    new ResizeObserver(resize).observe(hero);
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; cancelAnimationFrame(particleFrame); if (visible) particleStart(); }).observe(hero);
    document.addEventListener('visibilitychange', () => { cancelAnimationFrame(particleFrame); if (!document.hidden) particleStart(); });
    particleStart();
  }
})();
