// Finds "X vs Y" pairs that people actually search for, using Google autocomplete (US),
// and prints the pairs where both sides are destinations or hubs on the site.
// Usage: node scripts/find-comparisons.mjs [slug ...]   (default: every destination and hub)
// Review the output, then add the pairs you want to src/data/comparisons.json.
import fs from 'node:fs';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const dests = read('src/data/destinations.json');
const pairs = read('src/data/comparisons.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

// Names people type for each entity: the destination name, the part before "&" or "(", plus extra aliases.
const ALIASES = { 'cancun': ['cancun', 'riviera maya'], 'french-riviera': ['nice', 'french riviera'], 'salzburg': ['salzburg', 'hallstatt'], 'siem-reap': ['siem reap', 'angkor wat'], 'lombok': ['lombok', 'gili islands', 'gili'], 'komodo': ['komodo', 'labuan bajo'], 'cebu': ['cebu', 'bohol'], 'yunnan': ['yunnan', 'lijiang'], 'innsbruck': ['innsbruck'], 'santiago-chile': ['santiago', 'santiago chile'], 'patagonia': ['patagonia', 'el calafate'], 'amazon': ['amazon', 'amazon rainforest'], 'tahiti': ['tahiti', 'moorea'], 'salvador-brazil': ['salvador'], 'destin': ['destin'], 'acadia': ['acadia'], 'olympic-national-park': ['olympic national park'], 'glacier-national-park': ['glacier national park'], 'grand-teton': ['grand teton'], 'arches-bryce': ['arches', 'bryce canyon'], 'great-smoky-mountains': ['smoky mountains', 'great smoky mountains'], 'joshua-tree': ['joshua tree'], 'big-island': ['big island'] };
const entities = [];
for (const d of dests) {
  const names = new Set([norm(d.name), norm(d.name.split(/ & | \(/)[0]), ...(ALIASES[d.slug] ?? [])]);
  entities.push({ id: d.slug, names: [...names] });
}
const hubNames = [...new Set(dests.flatMap((d) => [].concat(d.hub ?? [])))];
for (const h of hubNames) entities.push({ id: `hub:${h}`, names: [norm(h)] });
const byName = new Map();
for (const e of entities) for (const n of e.names) if (!byName.has(n)) byName.set(n, e.id);

const have = new Set(pairs.map(([a, b]) => [a, b].sort().join('|')));
const only = process.argv.slice(2);
const todo = entities.filter((e) => !only.length || only.includes(e.id));
const found = new Map();
for (const e of todo) {
  for (const name of e.names.slice(0, 2)) {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=${encodeURIComponent(`${name} vs `)}`;
    let list = [];
    try {
      list = (await (await fetch(url)).json())[1];
    } catch {
      continue;
    }
    list.forEach((s, i) => {
      const other = norm(s).split(' vs ')[1];
      if (!other) return;
      const id = byName.get(other);
      if (!id || id === e.id) return;
      const key = [e.id, id].sort().join('|');
      found.set(key, (found.get(key) ?? 0) + (10 - i));
    });
    await sleep(250);
  }
}
const fresh = [...found].filter(([k]) => !have.has(k)).sort((a, b) => b[1] - a[1]);
for (const [k, score] of fresh) console.log(JSON.stringify([...k.split('|'), score * 10]));
console.error(`${fresh.length} new pairs (${found.size} found, ${have.size} already on the site)`);
