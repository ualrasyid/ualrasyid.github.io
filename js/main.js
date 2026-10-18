(() => {
  'use strict';
  document.querySelector('#year').textContent = new Date().getFullYear();
  document.querySelectorAll('.visual-label').forEach(label => label.setAttribute('aria-hidden', 'true'));
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('#mobile-nav');
  const closeMenu = (restoreFocus = false) => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    mobileNav.hidden = true;
    document.body.classList.remove('menu-open');
    if (restoreFocus) menuButton.focus();
  };
  menuButton.addEventListener('click', () => {
    if (menuButton.getAttribute('aria-expanded') === 'true') return closeMenu();
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Close navigation');
    mobileNav.hidden = false;
    document.body.classList.add('menu-open');
  });
  mobileNav.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    closeMenu();
    const section = document.querySelector(link.hash);
    if (section) {
      section.setAttribute('tabindex', '-1');
      section.focus({ preventScroll: true });
      section.addEventListener('blur', () => section.removeAttribute('tabindex'), { once: true });
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) closeMenu(true);
    if (event.key !== 'Tab' || mobileNav.hidden) return;
    const last = mobileNav.querySelector('a:last-child');
    if (event.shiftKey && document.activeElement === menuButton) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); menuButton.focus();
    }
  });
  matchMedia('(min-width: 601px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  const copyButton = document.querySelector('#copy-email');
  const copyStatus = document.querySelector('#copy-status');
  let copyTimer;
  copyButton.addEventListener('click', async () => {
    clearTimeout(copyTimer);
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText('alrasyidubay@gmail.com');
      copyStatus.classList.remove('sr-only'); copyStatus.textContent = 'Copied!';
      copyButton.setAttribute('aria-label', 'Email address copied');
    } catch {
      copyStatus.classList.remove('sr-only'); copyStatus.textContent = 'Select the address to copy it.';
    }
    copyTimer = setTimeout(() => {
      copyStatus.textContent = ''; copyStatus.classList.add('sr-only');
      copyButton.setAttribute('aria-label', 'Copy email address');
    }, 3500);
  });
  if ('IntersectionObserver' in window) {
    const navLinks = [...document.querySelectorAll('.desktop-nav a')];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        navLinks.forEach(link => {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    }, { rootMargin: '-15% 0px -50% 0px', threshold: 0 });
    document.querySelectorAll('#home, #portfolio, #projects, #about, #contact').forEach(section => observer.observe(section));
  }
})();
