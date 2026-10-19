# Al Rasyid — Apple-inspired gallery concept

Contribution notes: `js/contribution-notes.js` progressively replaces each inline disclosure trigger with a button opening a native modal dialog styled by `css/contribution-notes.css`. The original role, description, software and responsibility list are reused without editing their text. The page does not expand. Native Escape, close button and backdrop click dismiss the notes, return focus and preserve page position; long notes scroll inside the panel. Without dialog support or JavaScript, the original native details remain available.

Current scroll behavior: production projects are pre-armed only when JavaScript motion is supported and enabled, then appear individually from opacity 0 with a .97-to-1 popup on entering their own scroll band. Durations remain 1200ms desktop / 1000ms compact. Revealed projects stay visible. Other section entrances use transforms only, avoiding the old visible-to-pale flash. Pause, reduced motion, print and keyboard access immediately expose pending content. No JavaScript means normal visible static content.

A buildless personal portfolio: HTML, CSS, and vanilla JavaScript. This local edition translates the spacious hierarchy, compact navigation, browsable lineup, and progressive detail of https://www.apple.com/my/ipad/ into Rasyid's own blackhole identity. It does not reuse Apple imagery, trademarks, copy, or source code.

## Preview and editing

Serve this directory on 127.0.0.1:8765. No build or installation required. Keep CVbuilder and ImageResize folder names intact.

- `index.html`: verified production roles, personal films, imagery, credits, and links.
- `css/apple-concept.css`: active light/neutral design system, dark blackhole stage and responsive layouts.
- `css/explorations-grid.css`: equal two-column film grid (one column on mobile), pearl rounded gallery container and transparent play overlays.
- `css/production-hover.css`: independent production-row hover and keyboard-focus surfaces.
- `css/hero-heading-size.css`: the hero headline's 30% smaller responsive type sizes.
- `css/production-story.css`: compact, naturally sized production rows, image left/copy right on desktop and stacked below 700px. Software labels and full responsibilities live inside native contribution disclosures. Independent scroll-triggered project entrances are described above; no sibling timer or viewport-height spacer per project.
- `js/apple-concept.js`: mobile menu, active navigation and offscreen player pausing.
- `css/scroll-motion.css` and `js/scroll-motion.js`: native once-only scroll entrances, staggered headings/cards, desktop blackhole drift and reading-progress line. No animation dependency. The existing Pause motion button pauses these effects too; reduced-motion and low-core devices receive static content. Mobile has shorter entrances and no parallax. Keyboard focus immediately settles its animated container. Content is never hidden waiting for JavaScript.
- `js/portfolio-video.js`: retained click-to-load films, native controls, loading/error feedback, retry and playback coordination.
- `js/shader-background.js`: retained original multipass WebGL2 blackhole, pause control and offscreen lifecycle. Preserve the original attribution to Shadertoy's Gargantua; its original authorship/license was not independently established. Check the original license before separate redistribution.
- `assets/rasyid-avatar.jpg`: original-color portrait, no filter or blend mode.
- `assets/collaborations/`: official promotional imagery; original source links remain on the page. CoComelon image: Netflix Jr. official Season 2 sneak peek, https://www.youtube.com/watch?v=kThz0o3Qqrw.
- `assets/portfolio/sources.json`: personal-work media provenance.

## Behavior

Production work stays before personal explorations. All three production cards remain accessible, with contribution notes opening without expanding the page. Promotional images identify team productions, not individual asset breakdowns or client endorsements. Four personal films use an equal responsive grid with labelled play controls and ArtStation links. Videos only stream after Play; loading/error feedback and retry remain available. Starting another film or scrolling a film offscreen pauses playback.

The two existing tool applications remain untouched. No removed approach/contact section is reintroduced. Contact remains a mailto link in navigation and footer. The unreleased Markdown-to-PDF item is not displayed as an available tool.

Without the enhancement script, production details and source links remain usable; navigation links remain visible on small screens. Without JavaScript, an explanatory film message points visitors to ArtStation. With no WebGL2, a CSS still blackhole is shown. Reduced motion disables smooth scrolling and hover transitions and defaults the retained shader to a still frame; the explicit motion control remains available.

System fonts only. No new dependencies, analytics, accounts, or form service. Earlier Edition II and Orbit Archive CSS/JS files remain inactive for recovery; only the scripts/styles listed in index.html are loaded.

## Publishing

This buildless website is published from the repository's main branch through GitHub Pages. Local backup files and inactive design experiments are not required for deployment. Preview locally before publishing changes.
