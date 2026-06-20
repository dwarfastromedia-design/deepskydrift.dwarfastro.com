# DeepSkyDrift

DeepSkyDrift is a browser-local astrophotography motion tool for DwarfAstro.

## Current release

Version: `0.9.3`

This release keeps the clean runtime architecture and adds tier-aware star acceleration plus a Moving Star Brightness control.

- `index.html` contains app markup only.
- `style.css` owns layout and responsive styling.
- `app.js` owns UI state, render/play/export behavior, Original and 9:16 Reel view modes, crop panning, motion-center placement, mobile Options behavior, acceleration, and moving-star brightness.
- `star-engine.js` owns star detection, star masks, starless/motion background creation, tier assignment, and sprite extraction.
- `consent.js` only handles cookie consent and Google Analytics loading.
- `version.json` is the version/cache metadata source.

## Product promise

DeepSkyDrift is AI-free. Motion is created from the uploaded image data in the browser.

Images stay on the user's device. Analytics only load after consent.
