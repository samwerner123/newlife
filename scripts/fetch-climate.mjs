// Builds src/data/climate.json.
//  - Temperatures, rainfall, rainy days and sunshine: the "Climate data" weather box
//    of each destination's English Wikipedia article (national met-service normals,
//    usually 1991–2020).
//  - Rainfall fallback when the box has none: NASA POWER climatology (MERRA-2, 2001–2020).
// Usage: NODE_USE_ENV_PROXY=1 node scripts/fetch-climate.mjs [slug ...]
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'src', 'data', 'climate.json');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const UA = 'SeasonScout/0.1 (static travel site; climate data builder)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.ok) return await res.json();
      console.warn(`  ${res.status} for ${url}`);
    } catch (e) {
      console.warn(`  ${e.message} for ${url}`);
    }
    await sleep(5000 * 2 ** i);
  }
  throw new Error(`failed: ${url}`);
}

async function wikitext(title) {
  const url = 'https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main' +
    `&format=json&formatversion=2&redirects=1&titles=${encodeURIComponent(title)}`;
  const page = (await getJson(url)).query.pages[0];
  return page.missing ? null : { title: page.title, text: page.revisions[0].slots.main.content };
}

// Returns the bodies of every {{Weather box ...}} in the text, braces balanced.
function weatherBoxes(text) {
  const boxes = [];
  const re = /\{\{\s*weather ?box\s*\n?\|/gi;
  let m;
  while ((m = re.exec(text))) {
    let depth = 0;
    for (let i = m.index; i < text.length - 1; i++) {
      if (text[i] === '{' && text[i + 1] === '{') { depth++; i++; }
      else if (text[i] === '}' && text[i + 1] === '}') {
        depth--; i++;
        if (depth === 0) { boxes.push(text.slice(m.index + 2, i - 1)); break; }
      }
    }
  }
  return boxes;
}

function splitParams(body) {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2);
    if (two === '{{' || two === '[[') { depth++; cur += two; i++; continue; }
    if (two === '}}' || two === ']]') { depth--; cur += two; i++; continue; }
    if (body[i] === '|' && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += body[i];
  }
  parts.push(cur);
  const params = {};
  for (const p of parts.slice(1)) {
    const eq = p.indexOf('=');
    if (eq < 0) continue;
    params[p.slice(0, eq).trim().toLowerCase().replace(/\s+/g, ' ')] = p.slice(eq + 1).trim();
  }
  return params;
}

function num(v) {
  if (v === undefined) return null;
  const clean = v
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[\s\S]*?<\/ref>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/[−–]/g, '-')
    .replace(/,/g, '')
    .trim();
  if (!/^-?\d+(\.\d+)?$/.test(clean)) return null;
  return parseFloat(clean);
}

const fToC = (f) => ((f - 32) * 5) / 9;

function parseBox(body) {
  const p = splitParams(body);
  const get = (m, ...keys) => {
    for (const k of keys) {
      const v = num(p[`${m.toLowerCase()} ${k}`]);
      if (v !== null) return { k, v };
    }
    return null;
  };
  const months = MONTHS.map((m, i) => {
    const hi = get(m, 'high c', 'high f');
    const lo = get(m, 'low c', 'low f');
    const pr = get(m, 'precipitation mm', 'rain mm', 'precipitation cm', 'precipitation inch', 'rain inch');
    const days = get(m, 'precipitation days', 'rain days');
    const sun = get(m, 'sun', 'd sun');
    let rain = null;
    if (pr) rain = pr.k.endsWith('inch') ? pr.v * 25.4 : pr.k.endsWith('cm') ? pr.v * 10 : pr.v;
    return {
      high: hi ? (hi.k.endsWith('f') ? fToC(hi.v) : hi.v) : null,
      low: lo ? (lo.k.endsWith('f') ? fToC(lo.v) : lo.v) : null,
      rain,
      rainDays: days ? days.v : null,
      sunHours: sun ? (sun.k === 'd sun' ? sun.v : sun.v / DAYS[i]) : null,
    };
  });
  const location = (p.location || '')
    .replace(/<ref[\s\S]*?<\/ref>|<ref[^>]*\/>/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/\{\{convert\|([\d.,]+)\|(\w+)[^}]*\}\}/gi, '$1 $2')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/<[^>]+>/g, '')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  const rainDaysUnit = (p['unit precipitation days'] || p['unit rain days'] || '').replace(/<[^>]+>/g, '').trim();
  return { months, location, rainDaysUnit };
}

const complete = (box) => box.months.every((m) => m.high !== null && m.low !== null);

async function findBox(title) {
  const tried = [];
  const queue = [title];
  while (queue.length && tried.length < 6) {
    const t = queue.shift();
    if (tried.includes(t)) continue;
    tried.push(t);
    const page = await wikitext(t);
    if (!page) continue;
    const good = weatherBoxes(page.text).map(parseBox).find(complete);
    if (good) return { ...good, page: page.title };
    // Follow transcluded weather templates ({{Tokyo weatherbox}}) and climate sub-articles.
    for (const m of page.text.matchAll(/\{\{\s*([^{}|]*weather ?box[^{}|]*)\}\}/gi)) {
      queue.push(`Template:${m[1].trim()}`);
    }
    for (const m of page.text.matchAll(/\[\[(Climate of [^\]|#]+)/g)) queue.push(m[1].trim());
    queue.push(`Climate of ${page.title}`);
  }
  throw new Error(`no complete weather box (tried: ${tried.join(' | ')})`);
}

async function nasaRain(dest) {
  const url = 'https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=PRECTOTCORR' +
    `&community=RE&longitude=${dest.lon}&latitude=${dest.lat}&format=JSON`;
  const p = (await getJson(url)).properties.parameter.PRECTOTCORR;
  return MONTHS.map((m, i) => p[m.toUpperCase()] * DAYS[i]);
}

const r1 = (x) => (x === null ? null : Math.round(x * 10) / 10);

const destinations = JSON.parse(await fs.readFile(path.join(ROOT, 'src', 'data', 'destinations.json'), 'utf8'));
const only = process.argv.slice(2);
let out = {};
try {
  out = JSON.parse(await fs.readFile(OUT, 'utf8'));
} catch {}

const failed = [];
for (const dest of destinations) {
  if (only.length && !only.includes(dest.slug)) continue;
  process.stdout.write(`${dest.slug}: `);
  // climateWiki may be a list of candidate articles, tried in order.
  let box;
  const errors = [];
  for (const title of [].concat(dest.climateWiki || dest.wiki)) {
    try {
      box = await findBox(title);
      break;
    } catch (e) {
      errors.push(e.message);
    }
  }
  if (!box) {
    console.log(`SKIPPED — ${errors.join(' / ')}`);
    failed.push(dest.slug);
    continue;
  }
  let rainSource = 'wikipedia';
  if (box.months.some((m) => m.rain === null)) {
    const nasa = await nasaRain(dest);
    box.months.forEach((m, i) => { if (m.rain === null) m.rain = nasa[i]; });
    rainSource = 'nasa-power';
  }
  out[dest.slug] = {
    months: box.months.map((m) => ({
      high: r1(m.high),
      low: r1(m.low),
      rain: Math.round(m.rain),
      rainDays: r1(m.rainDays),
      sunHours: r1(m.sunHours),
    })),
    source: { page: box.page, location: box.location, rain: rainSource, rainDaysUnit: box.rainDaysUnit },
  };
  await fs.writeFile(OUT, JSON.stringify(out, null, 2) + '\n'); // save progress after each destination
  console.log(`${box.location.slice(0, 70)} | ` +
    out[dest.slug].months.map((m) => `${Math.round(m.high)}/${Math.round(m.low)}/${m.rain}`).join(' '));
  await sleep(2500);
}
await fs.writeFile(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${OUT}`);
if (failed.length) {
  console.log(`missing: ${failed.join(', ')}`);
  process.exitCode = 1;
}
