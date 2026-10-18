(() => {
  'use strict';
  const players = new Set();
  const pauseOthers = current => {
    players.forEach(player => { if (player !== current) player.pause(); });
  };

  document.querySelectorAll('.artwork-media[data-video-src]').forEach(container => {
    const trigger = container.querySelector('.video-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', () => {
      const poster = trigger.querySelector('img');
      const player = document.createElement('video');
      player.className = 'portfolio-player';
      player.controls = true;
      player.playsInline = true;
      player.preload = 'none';
      player.poster = poster.currentSrc || poster.src;
      player.setAttribute('aria-label', container.dataset.videoTitle + ' — film player');
      player.setAttribute('tabindex', '0');
      const source = document.createElement('source');
      source.src = container.dataset.videoSrc;
      source.type = 'video/mp4';
      player.appendChild(source);

      const feedback = document.createElement('div');
      feedback.className = 'video-feedback';
      const status = document.createElement('span');
      status.setAttribute('role', 'status');
      status.textContent = 'Loading film…';
      const retry = document.createElement('button');
      retry.type = 'button'; retry.className = 'video-retry';
      retry.textContent = 'Try again'; retry.hidden = true;
      feedback.append(status, retry);

      let loadingTimeout;
      const setLoading = () => {
        clearTimeout(loadingTimeout);
        status.textContent = 'Loading film…';
        feedback.hidden = false; retry.hidden = true;
        loadingTimeout = setTimeout(() => {
          status.textContent = 'Still loading. Check your connection or try again.';
          retry.hidden = false;
        }, 20000);
      };
      const showFailure = () => {
        clearTimeout(loadingTimeout);
        status.textContent = 'Could not load the film. Try again or use the ArtStation link below.';
        feedback.hidden = false; retry.hidden = false;
      };
      const requestPlay = () => {
        pauseOthers(player);
        const request = player.play();
        if (request) request.catch(error => {
          if (error.name === 'AbortError') return;
          if (error.name === 'NotAllowedError') {
            clearTimeout(loadingTimeout);
            status.textContent = 'Press Play in the player controls to start.';
            feedback.hidden = false;
          } else showFailure();
        });
      };
      player.addEventListener('loadstart', setLoading);
      player.addEventListener('playing', () => {
        clearTimeout(loadingTimeout); feedback.hidden = true; pauseOthers(player);
      });
      player.addEventListener('canplay', () => {
        clearTimeout(loadingTimeout); feedback.hidden = true;
      });
      player.addEventListener('waiting', setLoading);
      player.addEventListener('error', showFailure);
      source.addEventListener('error', showFailure);
      player.addEventListener('play', () => pauseOthers(player));
      retry.addEventListener('click', () => {
        setLoading(); player.load(); requestPlay();
      });

      players.add(player);
      trigger.replaceWith(player);
      container.appendChild(feedback);
      setLoading(); requestPlay();
      player.focus({ preventScroll: true });
    }, { once: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) players.forEach(player => player.pause());
  });
  window.addEventListener('pagehide', () => players.forEach(player => player.pause()));
})();
