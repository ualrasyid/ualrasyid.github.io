/* Accessibility bridge for the retained, pre-built tool applications. */
(() => {
  'use strict';
  const root = document.getElementById('root');
  if (!root) return;
  let fieldCount = 0;
  function improveToolSemantics() {
    if (location.pathname.toLowerCase().includes('imageresize')) {
      root.setAttribute('role', 'main'); root.setAttribute('aria-label', 'Image Resizer');
    }
    root.querySelectorAll('label').forEach(label => {
      if (label.htmlFor || label.querySelector('input,textarea,select')) return;
      const field = label.parentElement.querySelector('input,textarea,select');
      if (!field || field.type === 'hidden') return;
      if (!field.id) field.id = 'orbit-field-' + (++fieldCount);
      label.htmlFor = field.id;
      if (!field.name) field.name = field.id;
    });
    if (location.pathname.toLowerCase().includes('imageresize')) {
      root.querySelectorAll('h3').forEach(heading => {
        if (root.querySelector('h2')) return;
        heading.setAttribute('role', 'heading'); heading.setAttribute('aria-level', '2');
      });
    }
    root.querySelectorAll('button').forEach(button => {
      if (button.textContent.trim() || button.getAttribute('aria-label') || button.title) return;
      const svg = button.querySelector('svg');
      const classes = svg?.getAttribute('class') || '';
      if (classes.includes('trash')) button.setAttribute('aria-label', 'Remove this entry');
      else if (classes.includes('x') || classes.includes('close')) button.setAttribute('aria-label', 'Close');
    });
  }
  const observer = new MutationObserver(improveToolSemantics);
  observer.observe(root, { childList: true, subtree: true });
  improveToolSemantics();
})();
