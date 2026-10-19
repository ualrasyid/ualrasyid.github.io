(() => {
  'use strict';
  document.documentElement.classList.remove('no-js');
  const $ = selector => document.querySelector(selector);
  $('#year').textContent = new Date().getFullYear();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const lowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  const shouldAnimate = () => !reduced.matches && !lowEnd;
  const header = $('.site-header');
  const syncHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 60);
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  // Navigation works without a full-screen takeover or scroll hijacking.
  const menuButton = $('.menu-toggle');
  const mobileNav = $('#mobile-nav');
  const closeMenu = (returnFocus = false) => {
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    document.body.classList.remove('menu-open');
    if (returnFocus) menuButton.focus();
  };
  menuButton.addEventListener('click', () => {
    if (!mobileNav.hidden) return closeMenu();
    mobileNav.hidden = false;
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Close navigation');
    document.body.classList.add('menu-open');
  });
  mobileNav.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    closeMenu();
    if (!link.hash) return;
    const destination = document.querySelector(link.hash);
    if (destination) {
      destination.setAttribute('tabindex', '-1');
      destination.focus({ preventScroll: true });
      destination.addEventListener('blur', () => destination.removeAttribute('tabindex'), { once: true });
    }
  });
  document.addEventListener('keydown', event => {
    if (mobileNav.hidden) return;
    if (event.key === 'Escape') return closeMenu(true);
    if (event.key !== 'Tab') return;
    const lastLink = mobileNav.querySelector('a:last-child');
    if (event.shiftKey && document.activeElement === menuButton) {
      event.preventDefault(); lastLink.focus();
    } else if (!event.shiftKey && document.activeElement === lastLink) {
      event.preventDefault(); menuButton.focus();
    }
  });
  matchMedia('(min-width: 801px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  // Every production remains visible; the old tab selector is not used here.
  const selector = $('.production-selector');
  selector.remove();
  const gallery = $('#film-gallery');
  const cards = [...gallery.querySelectorAll('.artwork-card')];
  // The grid exposes every film; stop playback when a card leaves the page viewport.
  if ('IntersectionObserver' in window) {
    const filmObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) entry.target.querySelector('video')?.pause();
      });
    }, { threshold: .2 });
    cards.forEach(card => filmObserver.observe(card));
  }

  if ('IntersectionObserver' in window) {
    const navLinks = [...document.querySelectorAll('.desktop-nav a')];
    const navigationObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (!visible.length) return;
      const id = visible[0].target.id;
      navLinks.forEach(link => {
        if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-12% 0px -65% 0px' });
    document.querySelectorAll('#portfolio, #explorations, #projects, #about').forEach(section => navigationObserver.observe(section));
  }
})();
