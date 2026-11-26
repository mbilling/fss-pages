# CLAUDE.md — fss-pages

Single-page marketing site for the FSS MQTT tools, served by GitHub Pages.

## Rules
- Keep it static: no frameworks, no build step, no npm. Vanilla HTML/CSS/JS only.
- Numbers must be real. Every benchmark figure must trace to the fss-mqtt-broker README or `docs/benchmarks/` in that repo. Simulated content (terminal feed, failover demo) must stay labelled as simulated.
- Do not claim features that do not exist. Planned tools carry the `planned` badge in `assets/data.js`.
- Data lives in `assets/data.js`; behaviour in `assets/app.js`; tokens at the top of `assets/style.css`.
- Light and dark themes: every colour is a token, defined for dark in `:root` and for light twice (the `prefers-color-scheme` block and `[data-theme="light"]`); keep the two light blocks identical. No hard-coded colours in rules or inline SVG.
- Current-rig figures and earlier-rig figures (single-node comparison, 2026-09-16) are never mixed in one comparison; the broker repo says they are not comparable.
- Respect `prefers-reduced-motion`; keep text contrast ≥ 4.5:1; buttons ≥ 44 px; works at 360 px width.
- Fonts: Archivo (display/body, uses the `wdth` axis via `font-stretch`) and JetBrains Mono.

## Preview
`python3 -m http.server 8000` then open http://localhost:8000.

## Deploy
Push to `main`; `.github/workflows/pages.yml` publishes to Pages.
