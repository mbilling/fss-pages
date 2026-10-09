# fss-pages

The website for the **FSS** (fast, simple, secure) MQTT tools: [fss-mqtt](https://github.com/mbilling/fss-mqtt), [fss-mqtt-broker](https://github.com/mbilling/fss-mqtt-broker) and what comes next.

Plain static HTML, CSS and JavaScript. No build step, no dependencies.

## Preview locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Every push to `main` deploys to GitHub Pages via `.github/workflows/pages.yml`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Layout

| file | what |
| --- | --- |
| `index.html` | the single page: all copy and section structure |
| `assets/style.css` | design tokens (top of file) and all styles |
| `assets/data.js` | suite tools, benchmark numbers, TCO model inputs |
| `assets/app.js` | simulated terminal, failover demo, bars, calculator |
