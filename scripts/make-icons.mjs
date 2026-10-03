// Generates PNG app icons and the default social image from the SVG logo.
// Usage: node scripts/make-icons.mjs
import sharp from 'sharp';
import fs from 'node:fs/promises';

const svg = await fs.readFile('public/favicon.svg');
for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  await sharp(svg, { density: 512 }).resize(size, size).png().toFile(`public/${name}`);
}

// 1200×630 social card: logo mark on a soft sky-to-sunset gradient (no text, so no font dependency).
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d366b"/><stop offset="1" stop-color="#1c5cab"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="600" cy="315" r="120" fill="#eb6834"/>
  <g stroke="#eb6834" stroke-width="22" stroke-linecap="round">
    <path d="M600 110v50M600 470v50M395 315h50M755 315h50M455 170l36 36M709 424l36 36M455 460l36-36M709 206l36-36"/>
  </g>
</svg>`;
await sharp(Buffer.from(og)).png().toFile('public/og-default.png');
console.log('icons written');
