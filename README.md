# 📦 Container Space Calculator

Interactive 3D shipping container calculator. Add your items, see how they fit in a 20ft or 40ft container, and share the layout with your moving company.

**[Live Demo →](https://macat.github.io/container-calculator/)**

## Features

- **3D bin-packing visualization** — Maximal Rectangles algorithm with 6-rotation support
- **Room-based inventory** — organize items by room with color coding
- **Inline editing** — click any item name or dimensions to edit in-place
- **20ft / 40ft toggle** — switch container sizes instantly
- **Hover cross-highlighting** — hover items in the list or 3D view to highlight both
- **Share via URL** — compressed state in the URL hash, no server needed
- **PDF export** — download a full inventory report with 3D snapshot
- **Box presets** — quick-add common box sizes (wardrobe, book, medium, small, artwork)

## How It Works

1. Add rooms and items with dimensions (in inches)
2. The packing algorithm places items largest-first, trying all rotations
3. Items are packed bottom-up, flush against walls and each other
4. If items don't fit, an overflow warning shows how much excess volume there is
5. Click **Share** to copy a URL with your full inventory encoded in it

## Tech

Pure HTML/CSS/JS — no build step, no server.

- [Three.js](https://threejs.org/) for 3D rendering
- [lz-string](https://github.com/pieroxy/lz-string) for URL compression
- [jsPDF](https://github.com/parallax/jsPDF) for PDF export

## License

MIT
