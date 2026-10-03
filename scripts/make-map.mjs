// Builds src/data/world.json: an SVG path of the world's land (Natural Earth 1:110m via world-atlas)
// in a simple equirectangular projection, cropped to 85°N–60°S. The map page projects destination
// coordinates with the same formula (see src/pages/map.astro).
// Usage: node scripts/make-map.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
import { geoEquirectangular, geoPath } from 'd3-geo';

const require = createRequire(import.meta.url);
const land = require('world-atlas/land-110m.json');
const W = 1000;
const NORTH = 85;
const SOUTH = -60;
const scale = W / (2 * Math.PI);
const projection = geoEquirectangular().scale(scale).translate([W / 2, (scale * NORTH * Math.PI) / 180]);
const H = Math.round((W * (NORTH - SOUTH)) / 360);
const d = geoPath(projection).digits(1)(feature(land, land.objects.land));
fs.writeFileSync('src/data/world.json', JSON.stringify({ w: W, h: H, north: NORTH, south: SOUTH, d }) + '\n');
console.log(`src/data/world.json: ${W}×${H}, ${Math.round(d.length / 1024)} KB`);
