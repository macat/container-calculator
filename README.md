# Container Calculator 📦

A 3D shipping container space planner for international moves. Add rooms and items, visualize how they fit inside a 20ft or 40ft shipping container, and get real-time fill percentage calculations.

![Container Calculator](screenshot.png)

## Features

- **Room-based organization** — Add rooms and items with dimensions
- **3D visualization** — See items packed inside the container using Three.js
- **Color-coded by room** — Each room gets a distinct color
- **Container toggle** — Switch between 20ft and 40ft containers
- **Real-time stats** — Fill percentage, used/remaining volume
- **Bin packing** — Simple bottom-up, back-to-front packing algorithm
- **Pre-populated** — Comes loaded with a sample NYC→Budapest move inventory
- **No build step** — Open `index.html` directly in any browser

## Container Specs

| Container | Internal Dimensions | Volume |
|-----------|-------------------|--------|
| 20ft | 232" × 92" × 94" | 1,172 cu ft |
| 40ft | 473" × 92" × 94" | 2,390 cu ft |

## Usage

1. Clone the repo
2. Open `index.html` in a browser
3. Add/remove rooms and items
4. Toggle container size
5. Orbit the 3D view to inspect the packing

## Tech

- Vanilla HTML/CSS/JS
- [Three.js](https://threejs.org/) for 3D rendering (loaded via CDN)
- No backend, no build tools, no dependencies to install

## License

MIT
