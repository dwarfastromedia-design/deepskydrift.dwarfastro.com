# DeepSkyDrift

DeepSkyDrift is a browser-local astrophotography motion tool for DwarfAstro.

## Current release

Version: `0.9.2`

This cleanup release consolidates runtime behavior into the correct files:

- `index.html` contains app markup only.
- `style.css` owns layout, desktop/iPad styling, mobile portrait drawer styling, and diagnostics styling.
- `app.js` owns UI state, render/play/export behavior, Original and 9:16 Reel view modes, crop panning, motion-center placement, and mobile Options behavior.
- `star-engine.js` owns star detection, star masks, starless/motion background creation, and sprite extraction.
- `consent.js` only handles cookie consent and Google Analytics loading.
- `version.json` is the version/cache metadata source.

## Product promise

DeepSkyDrift is AI-free. It does not generate or invent stars, galaxies, or nebula structure. Motion is created from the uploaded image data in the browser.

Images stay on the user's device. Analytics only load after consent.

## V1.0 readiness checks

Before calling this V1.0, test:

1. Desktop/iPad normal flow.
2. Phone portrait Options drawer.
3. Original view loading and playback.
4. 9:16 Reel crop panning.
5. 9:16 motion-center placement.
6. Center marker toggle.
7. Play and Export.
8. Diagnostics views.
9. Cookie banner accept/decline.
10. Export filename/version.
