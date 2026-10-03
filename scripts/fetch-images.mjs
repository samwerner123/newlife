// Downloads one freely licensed photo per destination from Wikimedia Commons and
// records author + licence in src/data/images.json (shown as photo credits).
//  - The photo is the lead image of the destination's Wikipedia article, unless the
//    destination sets "imageFile" (a Commons file name) or "imagePage" (another article).
//  - Only CC BY, CC BY-SA, CC0 and public-domain files are accepted.
// Usage: NODE_USE_ENV_PROXY=1 node scripts/fetch-images.mjs [--force] [slug ...]
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT_DIR = path.join(ROOT, 'src', 'assets', 'destinations');
const OUT_JSON = path.join(ROOT, 'src', 'data', 'images.json');
const UA = 'SeasonScout/0.1 (static travel site; photo credits builder)';
const WIDTH = 1280; // Wikimedia only serves standard thumbnail widths (e.g. 960, 1280)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, as = 'text', tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } }).catch((e) => ({ ok: false, status: e.message }));
    if (res.ok) return as === 'buffer' ? Buffer.from(await res.arrayBuffer()) : as === 'json' ? res.json() : res.text();
    console.warn(`  ${res.status} for ${url}`);
    if (res.status === 404 || res.status === 400) return null;
    await sleep(5000 * 2 ** i);
  }
  throw new Error(`failed: ${url}`);
}

const LICENSES = [
  [/^cc-by-sa-(\d\.\d)/i, (v) => [`CC BY-SA ${v}`, `https://creativecommons.org/licenses/by-sa/${v}/`]],
  [/^cc-by-(\d\.\d)/i, (v) => [`CC BY ${v}`, `https://creativecommons.org/licenses/by/${v}/`]],
  [/^(cc-zero|cc0)/i, () => ['CC0', 'https://creativecommons.org/publicdomain/zero/1.0/']],
  [/^(pd|public domain)/i, () => ['Public domain', '']],
];

function findLicense(wikitext) {
  // Candidate template names, including the arguments of {{self|...}} and {{Licen[cs]eReview...}}.
  const names = [];
  for (const m of wikitext.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)) {
    const parts = m[1].split('|').map((s) => s.trim());
    if (/^self$/i.test(parts[0])) names.push(...parts.slice(1).filter((p) => !p.includes('=')));
    else names.push(parts[0]);
  }
  for (const n of names) {
    for (const [re, f] of LICENSES) {
      const m = n.match(re);
      if (m) return f(m[1]);
    }
  }
  return null;
}

function cleanWikitext(v) {
  return v
    .replace(/\{\{\s*creator\s*:\s*([^}|]+)[^}]*\}\}/gi, '$1')
    .replace(/\{\{\s*(?:u|user)\s*\|\s*([^}|]+)[^}]*\}\}/gi, '$1')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, '$1')
    .replace(/\[https?:\/\/\S+\]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/'''?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findAuthor(wikitext) {
  // An explicit attribution in the licence template wins ({{Cc-by-sa-3.0|attribution=...}}).
  const attr = wikitext.match(/\{\{\s*cc-[^}]*?\|\s*attribution\s*=\s*([^}|]+)/i);
  if (attr && cleanWikitext(attr[1])) return cleanWikitext(attr[1]);
  // Otherwise the {{Information}} author field, stopping at the next top-level "|".
  const m = wikitext.match(/\|\s*author\s*=\s*((?:\{\{[^{}]*\}\}|\[\[[^\]]*\]\]|\[[^\]]*\]|[^|\n{}[\]])*)/i);
  return (m && cleanWikitext(m[1])) || 'Unknown author';
}

function thumbUrl(file, width) {
  // Commons path: /thumb/<md5[0]>/<md5[0..1]>/<File>/<width>px-<File>; we get the hash dirs from the original URL.
  return `${file.dirs}/${encodeURIComponent(file.name)}/${width}px-${encodeURIComponent(file.name)}`;
}

async function leadImage(title) {
  const j = await get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`, 'json');
  const src = j?.originalimage?.source;
  if (!src) return null;
  const u = new URL(src);
  // Either /wikipedia/commons/a/ab/Name.jpg or /wikipedia/commons/thumb/a/ab/Name.jpg/3840px-Name.jpg
  const m =
    u.pathname.match(/^\/wikipedia\/commons\/thumb\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)\/[^/]+$/) ||
    u.pathname.match(/^\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)$/);
  if (!m) return null; // local (non-Commons) file — skip
  return { name: decodeURIComponent(m[3]), width: j.originalimage.width, dirs: `https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}` };
}

async function namedFile(name) {
  const { createHash } = await import('node:crypto');
  const n = name.replace(/^File:/, '').replace(/ /g, '_');
  const h = createHash('md5').update(n).digest('hex');
  return { name: n, width: null, dirs: `https://upload.wikimedia.org/wikipedia/commons/thumb/${h[0]}/${h.slice(0, 2)}` };
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));
const destinations = JSON.parse(await fs.readFile(path.join(ROOT, 'src', 'data', 'destinations.json'), 'utf8'));
let credits = {};
try {
  credits = JSON.parse(await fs.readFile(OUT_JSON, 'utf8'));
} catch {}
await fs.mkdir(OUT_DIR, { recursive: true });

for (const d of destinations) {
  if (only.length && !only.includes(d.slug)) continue;
  if (credits[d.slug] && !force && !only.length) continue;
  process.stdout.write(`${d.slug}: `);
  try {
    const file = d.imageFile ? await namedFile(d.imageFile) : await leadImage(d.imagePage || d.wiki);
    if (!file) throw new Error('no Commons lead image');
    if (/\.(svg|png|gif|tiff?)$/i.test(file.name)) throw new Error(`not a photo (${file.name})`);
    const raw = await get(`https://commons.wikimedia.org/w/index.php?title=${encodeURIComponent(`File:${file.name}`)}&action=raw`);
    if (!raw) throw new Error(`no file page for ${file.name}`);
    const license = findLicense(raw);
    if (!license) throw new Error(`no accepted licence for ${file.name}`);
    const width = file.width && file.width < WIDTH ? file.width : WIDTH;
    const img = await get(file.width && file.width <= WIDTH ? `${file.dirs.replace('/thumb', '')}/${encodeURIComponent(file.name)}` : thumbUrl(file, width), 'buffer');
    if (!img) throw new Error('image download failed');
    await fs.writeFile(path.join(OUT_DIR, `${d.slug}.jpg`), img);
    credits[d.slug] = {
      file: file.name,
      author: findAuthor(raw),
      license: license[0],
      licenseUrl: license[1],
      source: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.name)}`,
    };
    console.log(`${file.name} — ${credits[d.slug].author} (${license[0]})`);
  } catch (e) {
    console.log(`SKIPPED — ${e.message}`);
  }
  await sleep(1500);
}
await fs.writeFile(OUT_JSON, JSON.stringify(credits, null, 2) + '\n');
console.log(`wrote ${OUT_JSON}`);
