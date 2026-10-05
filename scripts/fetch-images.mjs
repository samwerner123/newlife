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
const UA = 'SeasonScoutBot/0.2 (https://github.com/samwerner123/newlife; photo credits builder)';
const WIDTH = 1280; // Wikimedia only serves standard thumbnail widths (e.g. 960, 1280)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, as = 'text', tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } }).catch((e) => ({ ok: false, status: e.message }));
    if (res.ok) return as === 'buffer' ? Buffer.from(await res.arrayBuffer()) : as === 'json' ? res.json() : res.text();
    console.warn(`  ${res.status} for ${url}`);
    if (res.status === 404 || res.status === 400) return null;
    const retry = Number(res.headers?.get?.('retry-after'));
    await sleep(Math.max(retry * 1000 || 0, 5000 * 2 ** i));
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
  // GFDL files relicensed in the 2009 licence migration are also available under CC BY-SA 3.0.
  if (/migration\s*=\s*relicense/i.test(wikitext) || /[{|]\s*cc-by-sa-all\s*[|}]/i.test(wikitext)) {
    return ['CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0/'];
  }
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
    // Wrapper templates whose content is the name: {{noping|X}}, {{Author assumed|X}}, {{author|Original|X}}.
    .replace(/\{\{\s*(?:noping|ping|nobr|nowrap)\s*\|\s*([^{}|]+)\}\}/gi, '$1')
    .replace(/\{\{\s*author assumed\s*\|\s*((?:\[\[[^\]]*\]\]|\[[^\]]*\]|[^{}])+)\}\}/gi, '$1')
    .replace(/\{\{\s*author\s*\|\s*[^|{}]*\|\s*((?:\[\[[^\]]*\]\]|\[[^\]]*\]|[^{}])+)\}\}/gi, '$1')
    .replace(/\{\{\s*creator\s*:\s*([^}|]+)[^}]*\}\}/gi, '$1')
    .replace(/\{\{\s*(?:u|user|user at project)\s*\|\s*([^}|]+)[^}]*\}\}/gi, '$1')
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
  // An explicit attribution in a licence template wins ({{Cc-by-sa-3.0|attribution=...}}, {{self|...|attribution=...}}).
  const attr = wikitext.match(/\|\s*attribution\s*=\s*((?:\[[^\]]*\]|[^|}\n])+)/i);
  if (attr && cleanWikitext(attr[1])) return cleanWikitext(attr[1]);
  // Photographers often sign with a personal template: {{User:Name/Author}}.
  const userTpl = wikitext.match(/\|\s*author\s*=\s*\{\{\s*User:([^/}|]+)\//i);
  if (userTpl) return userTpl[1].trim();
  // Otherwise the author/photographer/artist field, stopping at the next top-level "|".
  const m = wikitext.match(/\|\s*(?:author|photographer|artist)\s*=\s*((?:\{\{(?:[^{}]|\{\{[^{}]*\}\})*\}\}|\[\[[^\]]*\]\]|\[[^\]]*\]|[^|\n{}[\]])*)/i);
  return (m && cleanWikitext(m[1])) || null;
}

// Fallback: Commons' own parsed "Artist" field (works for any author template we don't recognise).
async function commonsArtist(name) {
  const j = await get(`https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&format=json&titles=${encodeURIComponent(`File:${name}`)}`, 'json');
  const page = j && Object.values(j.query?.pages ?? {})[0];
  const html = page?.imageinfo?.[0]?.extmetadata?.Artist?.value;
  const textValue = html?.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  return textValue || null;
}

// Fallback for licences set by wrapper templates ({{Korea.net}}, {{Flickr-Brooklyn-Museum}}…):
// Commons' own parsed licence name, accepted only when it is one of the free licences above.
async function commonsLicense(name) {
  const j = await get(`https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&format=json&titles=${encodeURIComponent(`File:${name}`)}`, 'json');
  const short = Object.values(j?.query?.pages ?? {})[0]?.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value;
  const m = short?.trim().match(/^CC (BY(?:-SA)?) (\d\.\d)$/i);
  if (m) return findLicense(`{{cc-${m[1].toLowerCase()}-${m[2]}}}`);
  if (/^(CC0|Public domain)$/i.test(short?.trim() ?? '')) return findLicense(/^CC0$/i.test(short.trim()) ? '{{cc0}}' : '{{pd}}');
  return null;
}

function thumbUrl(file, width) {
  // Commons path: /thumb/<md5[0]>/<md5[0..1]>/<File>/<width>px-<File>; we get the hash dirs from the original URL.
  return `${file.dirs}/${encodeURIComponent(file.name)}/${width}px-${encodeURIComponent(file.name)}`;
}

async function leadImage(title) {
  // The article's og:image is its lead image. Article HTML is served from Wikipedia's cache, so unlike
  // the REST API it isn't rate-limited.
  const html = await get(`https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`);
  const src = html?.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  if (!src) return null;
  const u = new URL(src);
  // Either /wikipedia/commons/a/ab/Name.jpg or /wikipedia/commons/thumb/a/ab/Name.jpg/3840px-Name.jpg
  const m =
    u.pathname.match(/^\/wikipedia\/commons\/thumb\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)\/[^/]+$/) ||
    u.pathname.match(/^\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)$/);
  if (!m) return null; // local (non-Commons) file — skip
  return { name: decodeURIComponent(m[3]), width: null, dirs: `https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}` };
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
    // imagePage may list several articles; the first whose lead image is a freely licensed photo wins.
    let file = null;
    let raw = null;
    let license = null;
    const reasons = [];
    const candidates = d.imageFile ? [null] : [].concat(d.imagePage || d.wiki);
    for (const page of candidates) {
      const f = page === null ? await namedFile(d.imageFile) : await leadImage(page);
      if (!f) { reasons.push(`${page}: no Commons lead image`); continue; }
      if (/\.(svg|png|gif|tiff?)$/i.test(f.name)) { reasons.push(`not a photo (${f.name})`); continue; }
      const r = await get(`https://commons.wikimedia.org/w/index.php?title=${encodeURIComponent(`File:${f.name}`)}&action=raw`);
      if (!r) { reasons.push(`no file page for ${f.name}`); continue; }
      const l = findLicense(r) ?? (await commonsLicense(f.name));
      if (!l) { reasons.push(`no accepted licence for ${f.name}`); continue; }
      file = f;
      raw = r;
      license = l;
      break;
    }
    if (!file) throw new Error(reasons.join('; '));
    const width = file.width && file.width < WIDTH ? file.width : WIDTH;
    const original = `${file.dirs.replace('/thumb', '')}/${encodeURIComponent(file.name)}`;
    // Thumbnails can't be larger than the original, so fall back to the original file if the thumb fails.
    const img = (await get(file.width && file.width <= WIDTH ? original : thumbUrl(file, width), 'buffer')) ?? (await get(original, 'buffer'));
    if (!img) throw new Error('image download failed');
    await fs.writeFile(path.join(OUT_DIR, `${d.slug}.jpg`), img);
    credits[d.slug] = {
      file: file.name,
      author: (findAuthor(raw) ?? (await commonsArtist(file.name)) ?? 'Unknown author').replace(/^User:/i, ''),
      license: license[0],
      licenseUrl: license[1],
      source: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.name)}`,
    };
    await fs.writeFile(OUT_JSON, JSON.stringify(credits, null, 2) + '\n'); // save progress
    console.log(`${file.name} — ${credits[d.slug].author} (${license[0]})`);
  } catch (e) {
    console.log(`SKIPPED — ${e.message}`);
  }
  await sleep(1500);
}
await fs.writeFile(OUT_JSON, JSON.stringify(credits, null, 2) + '\n');
console.log(`wrote ${OUT_JSON}`);
