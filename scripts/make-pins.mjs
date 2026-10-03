// Generates Pinterest pins (1000×1500 JPEG) for every country/region hub, in three designs:
//   1. photo + headline   2. photo + 12-month weather strip   3. "where to go each month" list
// Reads the built data (dist/api/destinations.json), so run `npm run build` first.
// Output: marketing/pins/<hub-slug>-<1|2|3>.jpg (not committed — upload them to Pinterest).
// Usage: node scripts/make-pins.mjs [hub-slug ...]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const W = 1000;
const H = 1500;
const OUT = 'marketing/pins';
const SITE = (process.env.SITE_URL || fs.readFileSync('src/config.ts', 'utf8').match(/url:\s*'([^']+)'/)[1]).replace(/^https?:\/\//, '').replace(/\/$/, '');
const BRAND = 'SeasonScout';
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COLORS = { great: '#0d366b', good: '#1c5cab', fair: '#3987e5', poor: '#86b6ef' };
const INK = { great: '#ffffff', good: '#ffffff', fair: '#0b0b0b', poor: '#0b0b0b' };
const FONT = "'Helvetica Neue', Helvetica, Arial, 'DejaVu Sans', sans-serif";

const api = JSON.parse(fs.readFileSync('dist/api/destinations.json', 'utf8'));
const hubText = JSON.parse(fs.readFileSync('src/data/hubs.json', 'utf8'));
const byId = new Map(api.dests.map((d) => [d.id, d]));
const slugify = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rating = (s) => (s >= 80 ? 'great' : s >= 65 ? 'good' : s >= 50 ? 'fair' : 'poor');

function ranges(ms) {
  if (!ms.length) return '';
  if (ms.length === 12) return 'all year round';
  const set = new Set(ms);
  return ms
    .filter((m) => !set.has((m + 11) % 12))
    .map((s) => {
      let e = s;
      while (set.has((e + 1) % 12) && (e + 1) % 12 !== s) e = (e + 1) % 12;
      return e === s ? MONTH_NAMES[s] : `${MONTH_NAMES[s].slice(0, 3)}–${MONTH_NAMES[e].slice(0, 3)}`;
    })
    .join(', ');
}

// Wraps a headline into lines of at most `max` characters.
function wrap(textValue, max) {
  const words = textValue.split(' ');
  const lines = [''];
  for (const w of words) {
    if ((lines.at(-1) + ' ' + w).trim().length > max) lines.push(w);
    else lines[lines.length - 1] = (lines.at(-1) + ' ' + w).trim();
  }
  return lines;
}

async function photo(slug, height) {
  return sharp(path.join('src/assets/destinations', `${slug}.jpg`)).resize(W, height, { fit: 'cover', position: 'attention' }).toBuffer();
}

const svg = (body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${body}</svg>`);

async function pinPhoto(hub, label, photoSlug) {
  const lines = wrap(`Best time to visit ${label}`, 16);
  const y0 = H - 140 - lines.length * 96;
  const overlay = svg(`
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.8"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    ${lines.map((l, i) => `<text x="60" y="${y0 + i * 96}" font-family="${FONT}" font-size="86" font-weight="800" fill="#fff">${esc(l)}</text>`).join('')}
    <text x="60" y="${H - 120}" font-family="${FONT}" font-size="40" fill="#fff" opacity="0.92">Weather month by month · ${esc(hub.bestText)}</text>
    <text x="60" y="${H - 60}" font-family="${FONT}" font-size="34" font-weight="700" fill="#fdba74">${BRAND} · ${esc(SITE)}</text>`);
  return sharp(await photo(photoSlug, H)).composite([{ input: overlay }]).jpeg({ quality: 82 }).toBuffer();
}

async function pinStrip(hub, label, photoSlug) {
  const top = 760;
  const cell = (W - 120) / 12;
  const cells = hub.months
    .map((m, i) => {
      const r = rating(m[0]);
      return `<rect x="${60 + i * cell + 4}" y="1010" width="${cell - 8}" height="130" rx="14" fill="${COLORS[r]}"/>
        <text x="${60 + i * cell + cell / 2}" y="1093" text-anchor="middle" font-family="${FONT}" font-size="44" font-weight="800" fill="${INK[r]}">${MONTHS[i]}</text>
        <text x="${60 + i * cell + cell / 2}" y="1190" text-anchor="middle" font-family="${FONT}" font-size="28" fill="#52514e">${m[1]}°</text>`;
    })
    .join('');
  const lines = wrap(`When to visit ${label}`, 22);
  const overlay = svg(`
    <rect y="${top}" width="${W}" height="${H - top}" fill="#f3f2ee"/>
    ${lines.map((l, i) => `<text x="60" y="${top + 100 + i * 76}" font-family="${FONT}" font-size="68" font-weight="800" fill="#0b0b0b">${esc(l)}</text>`).join('')}
    <text x="60" y="${top + 120 + lines.length * 76}" font-family="${FONT}" font-size="36" fill="#52514e">Best: ${esc(hub.bestText)}</text>
    ${cells}
    <text x="60" y="1260" font-family="${FONT}" font-size="28" fill="#52514e">Darker = better weather · average highs in °C</text>
    <text x="60" y="${H - 70}" font-family="${FONT}" font-size="36" font-weight="700" fill="#c2410c">${BRAND} · ${esc(SITE)}</text>`);
  return sharp({ create: { width: W, height: H, channels: 3, background: '#f3f2ee' } })
    .composite([{ input: await photo(photoSlug, top), top: 0, left: 0 }, { input: overlay }])
    .jpeg({ quality: 82 })
    .toBuffer();
}

async function pinList(hub, label, photoSlug) {
  const top = 430;
  const rows = hub.months
    .map((m, i) => {
      const best = hub.members.map((id) => byId.get(id)).filter(Boolean).sort((a, b) => b.months[i][0] - a.months[i][0])[0];
      const y = top + 210 + i * 66;
      const r = rating(best.months[i][0]);
      return `<text x="60" y="${y}" font-family="${FONT}" font-size="38" font-weight="800" fill="#0b0b0b">${MONTH_NAMES[i].slice(0, 3)}</text>
        <circle cx="185" cy="${y - 12}" r="13" fill="${COLORS[r]}"/>
        <text x="215" y="${y}" font-family="${FONT}" font-size="38" fill="#0b0b0b">${esc(best.name.length > 34 ? best.name.slice(0, 33) + '…' : best.name)}</text>`;
    })
    .join('');
  const lines = wrap(`Where to go in ${label}, month by month`, 24);
  const overlay = svg(`
    <rect y="${top}" width="${W}" height="${H - top}" fill="#fcfcfb"/>
    ${lines.map((l, i) => `<text x="60" y="${top + 85 + i * 64}" font-family="${FONT}" font-size="56" font-weight="800" fill="#0b0b0b">${esc(l)}</text>`).join('')}
    ${rows}
    <text x="60" y="${H - 50}" font-family="${FONT}" font-size="34" font-weight="700" fill="#c2410c">${BRAND} · ${esc(SITE)}</text>`);
  return sharp({ create: { width: W, height: H, channels: 3, background: '#fcfcfb' } })
    .composite([{ input: await photo(photoSlug, top), top: 0, left: 0 }, { input: overlay }])
    .jpeg({ quality: 82 })
    .toBuffer();
}

fs.mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
let made = 0;
for (const h of api.hubs) {
  const name = h.id.slice(4);
  const slug = slugify(name);
  if (only.length && !only.includes(slug)) continue;
  const label = hubText[name]?.label ?? name;
  const photoSlug = hubText[name]?.photo ?? h.members[0];
  const great = h.months.map((m, i) => (m[0] >= 80 ? i : -1)).filter((i) => i >= 0);
  const best = great.length ? great : h.months.map((m, i) => (m[0] >= 65 ? i : -1)).filter((i) => i >= 0);
  const hub = { ...h, bestText: ranges(best) || 'see the month-by-month guide' };
  fs.writeFileSync(path.join(OUT, `${slug}-1.jpg`), await pinPhoto(hub, label, photoSlug));
  fs.writeFileSync(path.join(OUT, `${slug}-2.jpg`), await pinStrip(hub, label, photoSlug));
  fs.writeFileSync(path.join(OUT, `${slug}-3.jpg`), await pinList(hub, label, photoSlug));
  made += 3;
}
console.log(`${made} pins written to ${OUT}/`);
