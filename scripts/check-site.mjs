// Checks the built site in dist/:
//  - every internal link, image and script points to a file that exists (no broken links);
//  - every JSON-LD block parses and has @context and @type, and FAQ/ItemList/Breadcrumb blocks are well-formed;
//  - every page has exactly one <h1>, a <title> and a meta description.
// Usage: npm run build && node scripts/check-site.mjs   (exits with code 1 on problems)
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else files.push(p);
  }
})(DIST);
const exists = new Set(files.map((f) => '/' + path.relative(DIST, f).split(path.sep).join('/')));
const html = files.filter((f) => f.endsWith('.html'));

const problems = [];
const target = (href) => {
  const clean = decodeURI(href.split('#')[0].split('?')[0]);
  if (!clean) return true;
  if (exists.has(clean)) return true;
  if (clean.endsWith('/') && exists.has(`${clean}index.html`)) return true;
  if (!clean.endsWith('/') && exists.has(`${clean}/index.html`)) return true;
  return false;
};

let links = 0;
let blocks = 0;
for (const file of html) {
  const page = '/' + path.relative(DIST, file).split(path.sep).join('/').replace(/index\.html$/, '');
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (!url.startsWith('/') || url.startsWith('//')) continue;
    links++;
    if (!target(url)) problems.push(`${page}: broken link ${url}`);
  }
  for (const m of src.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (url.startsWith('/') && !target(url)) problems.push(`${page}: broken srcset ${url}`);
    }
  }
  if (page.startsWith('/embed/')) continue;
  const h1 = (src.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1 && !page.startsWith('/404')) problems.push(`${page}: ${h1} <h1> elements`);
  if (!/<title>[^<]+<\/title>/.test(src)) problems.push(`${page}: missing <title>`);
  if (!/<meta name="description" content="[^"]+"/.test(src)) problems.push(`${page}: missing meta description`);
  // Words glued to a following link or bold text ("See<a …>"), which happens when Astro drops a line break before an
  // inline element; add {' '} at the end of the line. Ignores the logo and the score inside rating badges.
  const body = src.replace(/<(script|style)[\s\S]*?<\/\1>/g, '');
  for (const m of body.matchAll(/[a-z,;:]<(a|strong|em)[\s>]/g)) {
    problems.push(`${page}: missing space before <${m[1]}> near "${body.slice(Math.max(0, m.index - 30), m.index + 1).replace(/<[^>]*>/g, '')}"`);
    break;
  }
  for (const m of src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    blocks++;
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch (e) {
      problems.push(`${page}: invalid JSON-LD (${e.message})`);
      continue;
    }
    if (data['@context'] !== 'https://schema.org' || !data['@type']) problems.push(`${page}: JSON-LD without @context/@type`);
    if (data['@type'] === 'FAQPage' && !(data.mainEntity?.length > 0 && data.mainEntity.every((q) => q.name && q.acceptedAnswer?.text))) problems.push(`${page}: malformed FAQPage`);
    if (data['@type'] === 'ItemList' && !(data.itemListElement?.length > 0 && data.itemListElement.every((i) => i.position && i.url))) problems.push(`${page}: malformed ItemList`);
    if (data['@type'] === 'BreadcrumbList' && !data.itemListElement?.every((i) => i.position && i.name && i.item)) problems.push(`${page}: malformed BreadcrumbList`);
  }
}

console.log(`${html.length} pages, ${links} internal links, ${blocks} JSON-LD blocks checked`);
if (problems.length) {
  console.log(`${problems.length} problems:`);
  for (const p of problems.slice(0, 200)) console.log(`  ${p}`);
  process.exit(1);
}
console.log('No problems found.');
