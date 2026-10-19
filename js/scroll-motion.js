(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 800px)');
  const lowEnd = Boolean(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  const pauseButton = document.querySelector('#motion-toggle');
  const stage = document.querySelector('.hero-stage');
  const tokens = Object.freeze({
    duration: 1200, compactDuration: 1000, stagger: 80,
    distance: 28, compactDistance: 14, drift: 22,
    easing: 'cubic-bezier(.22,1,.36,1)'
  });
  const supported = 'IntersectionObserver' in window && typeof Element.prototype.animate === 'function';
  const shouldAnimate = () => supported && !reduced.matches && !lowEnd && pauseButton?.getAttribute('aria-pressed') !== 'true';
  const running = new Map();
  const seen = new WeakSet();
  let frame = 0;
  let stageVisible = true;
  let connected = true;

  function settle(element) {
    const animation = running.get(element);
    if (animation) { animation.cancel(); running.delete(element); }
    if (element.matches('.production-panel')) {
      element.classList.remove('project-reveal-pending');
      element.dataset.revealState = 'complete';
      seen.add(element);
      projectObserver?.unobserve(element);
    }
  }
  function cancelAll() { [...running.keys()].forEach(settle); }
  function enter(element, delay = 0) {
    const project = element.matches('.production-panel');
    if (!shouldAnimate() || element.contains(document.activeElement)) {
      if (project) { settle(element); element.dataset.revealState = 'static'; }
      return;
    }
    const distance = project ? (compact.matches ? 10 : 18) : (compact.matches ? tokens.compactDistance : tokens.distance);
    const startTransform = `translate3d(0,${distance}px,0)${project ? ' scale(.97)' : ''}`;
    const endTransform = `translate3d(0,0,0)${project ? ' scale(1)' : ''}`;
    if (project) element.dataset.revealState = 'entering';
    // Only pre-armed, not-yet-visible projects fade in. Already-visible content
    // must never jump down in opacity when it crosses an observer threshold.
    const frames = project && element.classList.contains('project-reveal-pending')
      ? [{ opacity: 0, transform: startTransform }, { opacity: 1, transform: endTransform }]
      : [{ transform: startTransform }, { transform: endTransform }];
    let animation;
    try { animation = element.animate(frames, {
      duration: compact.matches ? tokens.compactDuration : tokens.duration,
      delay: compact.matches ? 0 : delay,
      easing: tokens.easing,
      // Apply the first frame only during this short, already-triggered delay.
      // No forwards fill: finished content returns to its normal CSS immediately.
      fill: 'backwards'
    }); } catch {
      settle(element);
      return;
    }
    // The running animation now owns opacity; the normal settled CSS is visible.
    if (project) element.classList.remove('project-reveal-pending');
    running.set(element, animation);
    animation.onfinish = () => {
      if (running.get(element) === animation) running.delete(element);
      if (project) element.dataset.revealState = 'complete';
    };
  }

  const groups = new Map();
  document.querySelectorAll('.section-heading').forEach(heading => {
    groups.set(heading, [...heading.querySelectorAll('.section-index, h2, .section-intro')]);
  });
  document.querySelectorAll('.tool-card, .artwork-card, .about-heading, .portrait, .about-copy, .footer-top').forEach(element => groups.set(element, [element]));
  const projects = [...document.querySelectorAll('.production-panel')];
  projects.forEach(project => {
    project.dataset.revealState = shouldAnimate() ? 'waiting' : 'static';
    if (shouldAnimate()) project.classList.add('project-reveal-pending');
  });

  const revealObserver = supported ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || seen.has(entry.target)) return;
      seen.add(entry.target);
      revealObserver.unobserve(entry.target);
      const siblings = entry.target.matches('.tool-card')
        ? [...entry.target.parentElement.children].indexOf(entry.target) : 0;
      groups.get(entry.target).forEach((element, index) => enter(element, (siblings + index) * tokens.stagger));
    });
  }, { threshold: .08, rootMargin: '0px 0px -6% 0px' }) : null;
  // Separate vertical positions, independent scroll triggers, and no timed cascade.
  const projectObserver = supported ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || seen.has(entry.target)) return;
      seen.add(entry.target);
      projectObserver.unobserve(entry.target);
      enter(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -35% 0px' }) : null;
  const stageObserver = supported && stage ? new IntersectionObserver(entries => {
    stageVisible = entries[0].isIntersecting;
    schedule();
  }) : null;

  // Read geometry first, then write only compositor-friendly properties.
  function updateScroll() {
    frame = 0;
    if (!connected || document.hidden || !shouldAnimate()) return;
    const scrollable = Math.max(1, root.scrollHeight - innerHeight);
    const progress = Math.max(0, Math.min(1, scrollY / scrollable));
    const bounds = stageVisible && !compact.matches && stage ? stage.getBoundingClientRect() : null;
    const drift = bounds ? Math.max(-1, Math.min(1, -bounds.top / Math.max(bounds.height, 1))) * tokens.drift : 0;
    root.style.setProperty('--scroll-progress', progress.toFixed(4));
    root.style.setProperty('--scene-drift', `${drift.toFixed(2)}px`);
  }
  function schedule() {
    if (!frame && connected && !document.hidden && shouldAnimate()) frame = requestAnimationFrame(updateScroll);
  }
  function syncMotion() {
    const enabled = shouldAnimate();
    root.dataset.scrollMotion = enabled ? 'on' : 'off';
    if (!enabled) {
      cancelAnimationFrame(frame); frame = 0; cancelAll();
      projects.forEach(settle);
      root.style.removeProperty('--scroll-progress');
      root.style.removeProperty('--scene-drift');
    } else schedule();
  }
  function connectObservers() {
    groups.forEach((_, element) => { if (!seen.has(element)) revealObserver?.observe(element); });
    projects.forEach(project => { if (!seen.has(project)) projectObserver?.observe(project); });
    if (stageObserver) stageObserver.observe(stage);
  }

  document.addEventListener('focusin', event => {
    [...running.keys()].forEach(element => { if (element.contains(event.target)) settle(element); });
    projects.forEach(project => {
      if (project.contains(event.target)) settle(project);
    });
  });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => { cancelAll(); schedule(); }, { passive: true });
  reduced.addEventListener('change', syncMotion);
  compact.addEventListener('change', () => { cancelAll(); syncMotion(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAll(); cancelAnimationFrame(frame); frame = 0; }
    else schedule();
  });
  const pauseObserver = pauseButton ? new MutationObserver(syncMotion) : null;
  pauseObserver?.observe(pauseButton, { attributes: true, attributeFilter: ['aria-pressed'] });
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
  resizeObserver?.observe(document.body);
  window.addEventListener('pagehide', () => {
    connected = false; cancelAnimationFrame(frame); frame = 0; cancelAll();
    revealObserver?.disconnect(); projectObserver?.disconnect(); stageObserver?.disconnect(); resizeObserver?.disconnect(); pauseObserver?.disconnect();
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    connected = true; connectObservers(); resizeObserver?.observe(document.body);
    pauseObserver?.observe(pauseButton, { attributes: true, attributeFilter: ['aria-pressed'] });
    syncMotion();
  });
  connectObservers();
  syncMotion();
})();
