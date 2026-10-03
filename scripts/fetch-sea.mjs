// Builds src/data/sea.json: average sea-surface temperature by month for coastal destinations.
//  - Source: Open-Meteo Marine API (hourly sea-surface temperature, 2023–2025), nearest sea grid cell.
//  - Destinations whose nearest sea cell is more than MAX_KM away (inland cities, lakes) are skipped.
// Usage: NODE_USE_ENV_PROXY=1 node scripts/fetch-sea.mjs [slug ...]
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'src', 'data', 'sea.json');
const START = '2023-01-01';
const END = '2025-12-31';
const MAX_KM = 25;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function km(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

async function getJson(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      console.warn(`  ${res.status} for ${url}`);
    } catch (e) {
      console.warn(`  ${e.message}`);
    }
    await sleep(3000 * 2 ** i);
  }
  throw new Error(`failed: ${url}`);
}

const destinations = JSON.parse(await fs.readFile(path.join(ROOT, 'src', 'data', 'destinations.json'), 'utf8'));
const only = process.argv.slice(2);
let out = {};
try {
  out = JSON.parse(await fs.readFile(OUT, 'utf8'));
} catch {}

for (const d of destinations) {
  if (only.length && !only.includes(d.slug)) continue;
  if (!only.length && out[d.slug] !== undefined) continue;
  // An explicit sea point (e.g. the beach rather than the city centre) can be set per destination.
  const [lat, lon] = d.seaPoint ?? [d.lat, d.lon];
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=sea_surface_temperature&start_date=${START}&end_date=${END}&cell_selection=sea`;
  process.stdout.write(`${d.slug}: `);
  try {
    const j = await getJson(url);
    const dist = km(lat, lon, j.latitude, j.longitude);
    const sums = Array(12).fill(0);
    const counts = Array(12).fill(0);
    j.hourly.time.forEach((t, i) => {
      const v = j.hourly.sea_surface_temperature[i];
      if (v === null) return;
      const m = Number(t.slice(5, 7)) - 1;
      sums[m] += v;
      counts[m]++;
    });
    if (dist > MAX_KM || counts.some((c) => c < 24 * 20)) {
      console.log(`skipped (nearest sea cell ${Math.round(dist)} km away, ${Math.min(...counts)} hourly values)`);
      out[d.slug] = null;
    } else {
      const months = sums.map((s, m) => Math.round((s / counts[m]) * 2) / 2);
      out[d.slug] = { months, cell: [j.latitude, j.longitude] };
      console.log(months.join(' '));
    }
  } catch (e) {
    console.log(`FAILED — ${e.message}`);
  }
  await fs.writeFile(OUT, JSON.stringify(out, null, 2) + '\n');
  await sleep(400);
}
// Inland destinations stay in the file as null so later runs skip them (name a slug to retry it).
console.log(`wrote ${OUT}: ${Object.values(out).filter(Boolean).length} coastal destinations`);
