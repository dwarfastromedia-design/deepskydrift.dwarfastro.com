# DeepSkyDrift

DeepSkyDrift is a browser-local astrophotography motion tool for DwarfAstro.

## Current release

Version: `0.9.4`

This release keeps the clean runtime architecture and adds the playback retargeting fix: changing the motion center while the animation is playing no longer freezes playback. It also widens the Travel Speed and Moving Star Brightness ranges.

Mobile portrait layout now uses a bottom ad/brand image space instead of bottom Load/Play/Export controls. Mobile Play and Export are header icon actions, Load Image remains in the hamburger menu, Options sits below the header, and key Travel Speed / Moving Star Brightness controls are in the main Output & Motion section.

- `index.html` contains app markup only.
- `style.css` owns layout and responsive styling.
- `app.js` owns UI state, render/play/export behavior, Original and 9:16 Reel view modes, crop panning, motion-center placement, mobile Options behavior, acceleration, and moving-star brightness.
- `star-engine.js` owns star detection, star masks, starless/motion background creation, tier assignment, and sprite extraction.
- `consent.js` only handles cookie consent and Google Analytics loading.
- `assets/dwarfastro-mobile-banner.svg` is the mobile DwarfAstro banner/ad placeholder asset.
- `version.json` is the version/cache metadata source.

## Product promise

DeepSkyDrift is AI-free. Motion is created from the uploaded image data in the browser.

Images stay on the user's device. Analytics only load after consent.
