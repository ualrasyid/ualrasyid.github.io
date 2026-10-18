# Rasyid — Event Horizon

Personal portfolio for Ubaidillah Al Rasyid. Buildless HTML, CSS, and JavaScript, with the original WebGL2 black hole adapted for the new layout.

## Preview locally

From this folder, run:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/ in your browser. Stop the server with Ctrl+C. Use a web server rather than opening the HTML file directly; the two retained applications use JavaScript modules.

## Publish

Upload the contents of this folder to any static host. Keep the `CVbuilder/` and `ImageResize/` folder names and asset paths unchanged. No build step is required. The site works both at a domain root and under a subdirectory.

## Edit

- `index.html`: profile, projects, contact details, social links.
- `css/style.css`: design tokens, page layout, responsive styling.
- `js/main.js`: mobile menu, active navigation, copy-email action.
- `js/portfolio-video.js`: click-to-load inline video players, loading feedback, retry, and playback coordination.
- `js/shader-background.js`: retained black hole shader and rendering lifecycle.
- `assets/blackhole-mark.svg`: portfolio mark and favicon.
- `assets/rasyid-avatar.jpg`: optimized photo, derived from the original supplied portrait.
- `css/portfolio.css`: responsive ArtStation portfolio gallery.
- `assets/portfolio/`: local images for the four selected artworks, with responsive JPEG sizes and a compact WebP image.
- `assets/portfolio/sources.json`: original artwork URLs and image provenance.
- `css/tool-shell.css` and `js/tool-shell.js`: return navigation and accessibility for the retained tools.

The landing page has no runtime JavaScript dependency. Its fonts load from Google Fonts with system fallbacks. CV Builder retains its existing Tailwind CDN and html2pdf dependencies. The compiled application bundles are retained because their editable source projects were not present in the original folder.

## Motion and accessibility

Black hole animation is capped at 30 fps, pauses when outside the viewport or in a hidden tab, and defaults to a still frame for reduced-motion preferences. Pause/resume remains available. A CSS fallback is shown if WebGL2 or float framebuffer support is unavailable. Visible content never waits for animation or an intersection observer.

The shader retains the original file's attribution to Shadertoy's “Gargantua.” Its original authorship/license was not independently established in this rebuild; preserve the attribution and check the original shader's license before redistributing it separately.

The mobile menu exposes its expanded state, closes with Escape, and supports keyboard focus. All contact and social links use the original profile's destinations. Markdown to PDF remains explicitly marked as planned.

## ArtStation portfolio

The four artworks supplied by the owner appear in the Portfolio section before the tools. Each cover has a Play button that loads its film directly inside the card using the browser's native video player. Titles and the text links below each card still open the corresponding ArtStation project in a new tab. Poster images are stored locally and lazy-loaded. The original published titles and software labels were verified on the supplied ArtStation pages.

Video files stream from public ArtStation CDN URLs read from each artwork's own media player. They are not copied into this static package; internet access and continued availability of those CDN URLs are required. No video request is made before a visitor presses Play. Native controls provide pause, seek, volume, fullscreen, and inline playback on mobile. Starting a different film pauses the previous film. Films also pause when the tab is hidden or the page is left. A loading message, retry button, and retained ArtStation links cover connection failures. If video URLs change, update `data-video-src` in `index.html` and record the new source in `assets/portfolio/sources.json`.
