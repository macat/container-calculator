# 📦 Container Calculator

A 3D shipping container space planner for international moves. Visualize how your furniture and boxes fit inside a 20ft or 40ft shipping container.

**[Live App →](https://macat.github.io/container-calculator/)**

## Features

- **Room-by-room inventory** — Add rooms and items with dimensions (L×W×H)
- **3D visualization** — Three.js-powered view with color-coded items packed inside a wireframe container
- **20ft / 40ft toggle** — Switch between container sizes with real-time fill percentage
- **Box presets** — Quick-add wardrobe, book, medium, small, and artwork boxes
- **Share layouts** — Compress state into a URL and share with your shipping company
- **Export PDF** — Download a PDF with 3D snapshot + full inventory list
- **Orbitable camera** — Spin, zoom, and inspect the packing layout
- **Wireframe mode** — Toggle to see through packed items

## Sharing

Click **🔗 Share** to generate a shareable URL. The entire container layout is compressed into the URL hash — no backend needed. Anyone with the link sees the exact same configuration and can edit it freely.

## Export

Click **📄 Export PDF** to download a professional PDF including:
- Container size and fill percentage
- 3D visualization snapshot
- Room-by-room inventory with dimensions and volumes

## Tech

- Vanilla HTML/CSS/JS — no build step, just open `index.html`
- [Three.js](https://threejs.org/) for 3D rendering
- [lz-string](https://pieroxy.net/blog/pages/lz-string/index.html) for URL state compression
- [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com/) for PDF export

## Container Specs

| Container | Internal Dimensions | Volume |
|-----------|-------------------|--------|
| 20ft | 232" × 92" × 94" | 1,172 cu ft |
| 40ft | 473" × 92" × 94" | 2,390 cu ft |

## License

MIT
