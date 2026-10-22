# onlines.com.ar clone — static mirror

Pixel-accurate local mirror of `https://onlines.com.ar/` — mirrored assets only, no build step.

## What's inside

- `onlines.com.ar/index.html` — the page (pristine server HTML, asset paths rewritten to local)
- `wp-content/`, `wp-includes/` — original assets: CSS, JS, fonts (woff2), images (webp/avif/svg), favicon
- `<cdn-host>/…` folders — third-party-origin assets (fonts, scripts, trackers) mirrored locally so the page renders fully offline
- `vercel.json` — rewrites `/` to the page

## Host on Vercel

1. Import this repo into Vercel (framework preset: **Other** — no build command, no output dir config needed)
2. Deploy. The root rewrite in `vercel.json` serves `onlines.com.ar/index.html` at `/`

## Run locally

```
python -m http.server 8080 --directory .
# open http://localhost:8080/onlines.com.ar/index.html
```

Requires any static server (does not work over `file://` — absolute asset paths need a root).

## Notes

- All JS/CSS/fonts/images are byte-copies of the original — scroll-lock intro, Lenis smooth scrolling, Swiper sliders, hero cursor choreography run exactly as on the live site.
- Analytics endpoints (GA/Facebook/Clarity) are mirrored as inert local files; their beacons 404 quietly, with zero visual effect.
- Navigation links to other pages on the original domain stay absolute (pointing live) — this is a single-page mirror by design.
