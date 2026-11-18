(() => {
  'use strict';
  const root = document.documentElement;
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
