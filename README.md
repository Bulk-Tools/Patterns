<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Pattern Forge Advanced

Pattern Forge Advanced is a React + Vite tool for generating seamless mathematical patterns for previews and high-resolution exports.

## Features

- **Engine registry** for six procedural engines (isometric, wave, ribbon, truchet, hexagonal, spirograph)
- **Preset packs** for quick starting points
- **Favorite patterns** saved to browser storage
- **Seeded share URLs** so exact outputs can be reproduced
- **Advanced export settings**
  - SVG and PNG export
  - transparent backgrounds
  - DPI scale
  - batch export across aspect ratios
- **Performance guardrails** for extreme complexity and export size
- **Render telemetry** showing frame render time in the status bar

## Run locally

### Prerequisites

- Node.js 20+

### Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Quality checks

```bash
npm run lint
npm run test
npm run build
```

## Engine overview

- **Isometric Lattice**: angular line networks with optional node circles
- **Harmonic Wave Synthesis**: concentric wave rings with randomized phase
- **Parametric Ribbon Curve**: lissajous-style line ribbons per cell
- **Truchet Maze Matrix**: arc tiling for labyrinth-like motifs
- **Hexagonal Tessellation**: honeycomb lattice with optional center circles
- **Orbital Spirograph**: hypotrochoid/epitrochoid inspired curves

## Troubleshooting

- If very large PNG export fails, reduce resolution or DPI scale.
- If preview slows down, lower Grid X/Y or Complexity.
- If clipboard sharing fails, ensure browser permissions allow clipboard writes.

## Example shareable seed

After generating a pattern, copy share URL from the **Share** button. Example structure:

```text
http://localhost:3000/?pattern=<base64-encoded-pattern-state>
```

## Media placeholders

- Add screenshots to `/home/runner/work/Patterns/Patterns/docs/screenshots`
- Add demo GIFs to `/home/runner/work/Patterns/Patterns/docs/gifs`

(These folders are optional and can be added when assets are available.)
