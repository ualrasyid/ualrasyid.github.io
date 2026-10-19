(() => {
  'use strict';
  const dialog = document.createElement('dialog');
  if (typeof dialog.showModal !== 'function') return;
  dialog.className = 'contribution-notes';
  dialog.id = 'contribution-notes';
  dialog.setAttribute('aria-labelledby', 'contribution-note-title');
  dialog.setAttribute('aria-describedby', 'contribution-note-description');
  const create = (tag, className, text) => {
    const element = document.createElement(tag);
    element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  const header = create('header', 'contribution-note-header');
  const eyebrow = create('p', 'contribution-note-eyebrow', 'PROJECT NOTES / MY CONTRIBUTION');
  const title = create('h2', 'contribution-note-title');
  title.id = 'contribution-note-title';
  const close = create('button', 'contribution-note-close', '×');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close contribution notes');
  close.setAttribute('autofocus', '');
  header.append(eyebrow, title, close);
  const body = create('div', 'contribution-note-body');
  body.tabIndex = 0;
  body.setAttribute('role', 'region');
  body.setAttribute('aria-label', 'Contribution details');
  const role = create('p', 'contribution-note-role');
  const description = create('p', 'contribution-note-description');
  description.id = 'contribution-note-description';
  const softwareLabel = create('h3', 'contribution-note-label', 'TOOLS');
  const software = create('p', 'contribution-note-software');
  const responsibilities = create('h3', 'contribution-note-label', 'WHAT I WORKED ON');
  const list = create('div', 'contribution-note-list');
  body.append(role, description, softwareLabel, software, responsibilities, list);
  dialog.append(header, body);
  document.body.append(dialog);
  let opener = null;
  let pagePosition = { left: 0, top: 0 };
  let outsidePress = false;
  const isOutside = event => {
    const box = dialog.getBoundingClientRect();
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  };
  close.addEventListener('click', () => dialog.close());
  // A backdrop click closes, but dragging text from inside to outside does not.
  dialog.addEventListener('pointerdown', event => { outsidePress = event.target === dialog && isOutside(event); });
  dialog.addEventListener('click', event => {
    if (outsidePress && event.target === dialog && isOutside(event)) dialog.close();
    outsidePress = false;
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('contribution-notes-open');
    window.scrollTo({ ...pagePosition, behavior: 'instant' });
    opener?.setAttribute('aria-expanded', 'false');
    opener?.focus({ preventScroll: true });
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    if (event.shiftKey && document.activeElement === close) {
      event.preventDefault(); body.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === body) {
      event.preventDefault(); close.focus({ preventScroll: true });
    }
  });
  // Native showModal provides background inertness, focus containment and Escape.
  document.querySelectorAll('.production-panel').forEach(project => {
    const details = project.querySelector('.contribution-details');
    const originalList = details?.querySelector('ul');
    if (!details || !originalList) return;
    const button = create('button', 'contribution-button');
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', dialog.id);
    button.setAttribute('aria-expanded', 'false');
    button.append(create('span', '', 'My contribution'));
    const plus = create('span', 'contribution-button-plus', '+');
    plus.setAttribute('aria-hidden', 'true');
    button.append(plus);
    details.before(button);
    details.open = false;
    details.hidden = true;
    button.addEventListener('click', () => {
      title.textContent = project.querySelector('h3').textContent.replace(/\s+/g, ' ').trim();
      role.textContent = project.querySelector('.project-role').textContent;
      description.textContent = project.querySelector('.project-description').textContent;
      software.textContent = details.querySelector('.project-software')?.textContent || '';
      list.replaceChildren(originalList.cloneNode(true));
      opener = button;
      pagePosition = { left: window.scrollX, top: window.scrollY };
      try {
        dialog.showModal();
        body.scrollTop = 0;
        document.documentElement.classList.add('contribution-notes-open');
        window.scrollTo({ ...pagePosition, behavior: 'instant' });
        button.setAttribute('aria-expanded', 'true');
      } catch {
        // If modal enhancement fails, preserve the original readable disclosure.
        details.hidden = false; button.hidden = true; details.open = true;
        details.querySelector('summary').focus({ preventScroll: true });
      }
    });
  });
})();
