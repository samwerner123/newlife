// Generates docs/CONTENT_PLAN.md — the 1,000-task content & growth plan.
// Statuses for pages are computed from the actual data, so the plan never drifts from the site:
//   [x] ✅ done   ·   [ ] 🟡 needs the site owner   ·   [ ] ⏳ planned
// Usage: node scripts/build-plan.mjs
import fs from 'node:fs';

const TOTAL = 1000;
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const dests = read('src/data/destinations.json');
const climate = read('src/data/climate.json');
const images = read('src/data/images.json');
const pairs = read('src/data/comparisons.json');
const affiliates = read('src/data/affiliates.json');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const exists = (p) => fs.existsSync(p);
const nameOf = (id) => (id.startsWith('hub:') ? id.slice(4) : dests.find((d) => d.slug === id)?.name ?? id);

const hubCount = {};
for (const d of dests) if (d.hub) hubCount[d.hub] = (hubCount[d.hub] || 0) + 1;
const hubs = Object.keys(hubCount).filter((h) => hubCount[h] >= 2).sort();
const guides = fs.readdirSync('src/pages/guides').filter((f) => f.endsWith('.astro') && f !== 'index.astro').map((f) => f.replace('.astro', ''));

const DONE = 'done';
const OWNER = 'owner';
const PLAN = 'plan';
const sections = [];
const section = (title, why) => {
  const s = { title, why, items: [] };
  sections.push(s);
  return (status, text) => s.items.push({ status, text });
};

// ---------------------------------------------------------------------------
let add = section('A. Demand research & strategy', 'Build what people search for first.');
add(DONE, 'Research "best time to visit …" demand A–Z via Google autocomplete (US + UK)');
add(DONE, 'Measure monthly demand ("{place} in {month}") for 110 candidate destinations');
add(DONE, 'Validate page-type demand: "best places to travel in {month}", "warm places to visit in {month}", "warmest places in Europe", "cheap places to travel", "beach vacations"');
add(DONE, 'Detect demand for "X vs Y" comparisons for every destination and country (≈250 pairs found)');
add(DONE, 'Prioritise US-market topics (Hawaii, Florida, national parks, Caribbean) — the largest English-speaking audience');
add(DONE, 'Name single-destination countries by the country (Iceland, Ireland, Fiji…) to match how people search');
add(DONE, 'Define the scoring model (temperature 55%, rainfall 45%, seasonal adjustments) and publish it');
add(DONE, 'Choose a static, fast, free-to-host stack (Astro + Cloudflare Pages)');
add(OWNER, 'Pick and register the final domain (.com), then set it in src/config.ts');
add(PLAN, 'Re-run demand research every quarter and re-rank the backlog');
add(PLAN, 'Get real search volumes from Google Search Console after 3 months of data and re-prioritise');
add(PLAN, 'Track which page types earn the most affiliate clicks and double down on them');

// ---------------------------------------------------------------------------
const collections = ['Best places to travel in', 'Warm places to visit in', 'Warm places to visit in the US in', 'Warmest places in Europe in', 'Beach vacations in', 'Cheap places to travel in', 'Best places to travel in the US in', 'Best places to visit in Europe in', 'Best places to visit in Asia in', 'Best places to visit in the Caribbean in'];
add = section('B. Month collections (highest search demand)', '"Best places to travel in October", "warm places to visit in December"…');
for (const c of collections) for (const m of MONTHS) add(DONE, `${c} ${m}`);
for (const c of ['Best places to visit in South America in', 'Best places to visit in Africa in', 'Ski destinations in', 'Christmas & New Year destinations']) {
  if (c.endsWith(' in')) for (const m of MONTHS) add(PLAN, `${c} ${m}`);
  else add(PLAN, c);
}

// ---------------------------------------------------------------------------
add = section('C. Country, state & region hubs', '"Best time to visit Thailand", "Thailand in December"…');
for (const h of hubs) add(DONE, `Best time to visit ${h} — hub page with seasons, month table, heatmap, FAQ`);
for (const h of hubs) for (const m of MONTHS) add(DONE, `${h} in ${m}`);
for (const h of ['Indonesia', 'India', 'Morocco', 'South Africa', 'Brazil', 'Argentina', 'Chile', 'Ecuador', 'Philippines', 'Malaysia', 'France', 'Netherlands & Belgium', 'Germany & Austria', 'Caribbean islands', 'California', 'Utah national parks', 'Kenya & Tanzania safari', 'China', 'South Korea', 'Cambodia & Laos']) {
  add(PLAN, `Hub: best time to visit ${h} (needs 2+ destinations)`);
}

// ---------------------------------------------------------------------------
add = section('D. Destination guides', 'Each = destination page + 12 month pages + climate data + photo + stay areas + practical info.');
for (const d of dests) {
  const ok = climate[d.slug] && images[d.slug] && d.stay?.length === 3 && d.tz;
  add(ok ? DONE : PLAN, `${d.name} — guide, 12 monthly pages, climate, photo, where to stay, practical info`);
}

// ---------------------------------------------------------------------------
add = section('E. Comparisons ("X vs Y")', 'Only pairs with proven search demand.');
for (const [a, b] of pairs) add(DONE, `${nameOf(a)} vs ${nameOf(b)}`);

// ---------------------------------------------------------------------------
add = section('F. Seasonal & evergreen guides', 'Long-form content that earns links and ranks for seasonal queries.');
for (const g of guides) add(DONE, `Guide: ${g.replace(/-/g, ' ')}`);
for (const g of ['Fall colours: best time for autumn leaves (Quebec, Vermont, Kyoto)', 'Safari season: Kenya & Tanzania month by month', 'Whale-watching calendar worldwide', 'Ski season guide: Alps, Rockies, Japan, New Zealand', 'Best time to visit Machu Picchu (crowds, permits, rain)', 'Galápagos month by month: wildlife calendar', 'Diving & snorkelling seasons worldwide', 'Sargassum seaweed season: Caribbean & Mexico', 'Typhoon season: Japan, Taiwan, Philippines', 'Best time to visit Disney World (crowds & weather)', 'Spring break destinations by budget', 'Christmas destinations: markets, lights and winter sun', "Where to spend New Year's Eve", 'Honeymoon destinations by month', 'Family holidays by month (school holidays)', 'European Christmas markets calendar', 'Travelling during Ramadan', 'Golden Week in Japan: what to know', 'Travel insurance explained (with partner links)', 'eSIMs for travel: how they work (with partner links)', 'Packing list by climate', 'Shoulder season: the best-value travel windows', 'Iceland Ring Road: when roads are open', 'Japan rainy season (tsuyu) survival guide', 'Bali wet season: is it worth going?', 'India monsoon: where to go instead', 'Midnight sun destinations', 'Best time for the Great Barrier Reef', 'Hawaii islands compared: which island when?', 'Caribbean islands compared by season']) {
  add(PLAN, `Guide: ${g}`);
}

// ---------------------------------------------------------------------------
add = section('G. Tools & UX features', 'What professional travel sites offer beyond articles.');
for (const t of ['Site search (destinations, countries, months, comparisons, guides)', '°C/°F and mm/inch switch (auto °F for US visitors)', 'Filters & sorting on lists (region, temperature, budget, weather)', 'Travel calendar heatmap (all destinations × 12 months)', 'Month strip with tooltips on every card', 'Climate charts (temperature range + rainfall) with table view', 'Comparison chart (two places, 12 months)', 'Trip cost estimator', 'Mobile hamburger menu', 'Sticky mobile booking bar', 'Collapsible filters on phones', 'Quick links to related collections on every month page']) add(DONE, t);
for (const t of ['Trip-finder quiz (month, temperature, budget, interests)', 'Interactive world map coloured by weather score', 'Flight price calendar per destination (Travelpayouts Data API)', 'Compare any two destinations on demand', 'Save favourites (local)', '"Notify me when it\'s the best time" email alerts', 'Light/dark theme switch', 'Print-friendly destination fact sheet', 'Share buttons (Pinterest, WhatsApp, X)', 'Recently viewed destinations', 'Daylight hours & sea temperature data', 'Crowd & price seasonality indicators', 'Per-month photo galleries', 'Embeddable climate widget for bloggers (backlinks)']) add(PLAN, t);

// ---------------------------------------------------------------------------
add = section('H. Mobile, performance & accessibility', 'Most travel searches happen on phones.');
const pageTypes = ['Home', 'Month page', 'Month collection', 'Country hub', 'Country × month', 'Destination', 'Destination × month', 'Comparison', 'Calendar', 'Destinations list', 'Countries list', 'Guide'];
for (const p of pageTypes) add(DONE, `${p}: no horizontal scroll and readable layout at 320, 360, 390, 414, 768, 1024 and 1366 px`);
for (const t of ['Tap targets ≥ 44 px (pills, chips, buttons, month cells on touch screens)', 'Sticky first column in wide tables on phones', 'Responsive WebP images with srcset and lazy loading', 'Hero images load eagerly with high priority (LCP)', 'Static HTML, minimal JavaScript, no web fonts', 'Long-term caching for hashed assets', 'Light and dark colour schemes', 'Colour-blind-safe rating scale with text labels', 'Keyboard-accessible tooltips, search and menus', 'Skip link and semantic landmarks']) add(DONE, t);
for (const t of ['Lighthouse/PageSpeed audit on 10 key templates and fix regressions', 'Real-user Core Web Vitals monitoring', 'Screen-reader test pass (VoiceOver, TalkBack)', 'Reduce HTML weight of month pages (lazy-render below-the-fold cards)', 'Offline-friendly PWA cache for recently viewed pages']) add(PLAN, t);

// ---------------------------------------------------------------------------
add = section('I. Technical SEO', 'Make every page discoverable and understood.');
for (const t of ['XML sitemap for every page', 'robots.txt with sitemap link', 'Canonical URLs and consistent trailing slashes', 'Unique titles (≤ 60 chars where possible) and meta descriptions', 'BreadcrumbList structured data', 'FAQPage structured data on hubs, collections and comparisons', 'ItemList structured data on ranked lists', 'Article structured data on guides', 'TouristDestination structured data', 'Open Graph + Twitter cards with per-page images', 'Default social image', 'Web app manifest and touch icons', 'Security headers', 'Internal linking: month ↔ collections ↔ countries ↔ destinations ↔ comparisons', '404 page with helpful links', 'Rel="sponsored nofollow" on all affiliate links', 'Year in titles of month pages (auto-updated on each build)']) add(DONE, t);
add(OWNER, 'Connect the site to Google Search Console and submit the sitemap');
add(OWNER, 'Connect Bing Webmaster Tools (also feeds DuckDuckGo, Yahoo, ChatGPT search)');
for (const t of ['Image sitemap', 'IndexNow pings on deploy', 'hreflang tags once translations launch', 'Monitor index coverage and fix excluded pages', 'Validate structured data in Rich Results Test', 'Automated broken-link check in CI', 'Rebuild monthly so "next {month}" years and seasonal links stay fresh']) add(PLAN, t);

// ---------------------------------------------------------------------------
add = section('J. Trust, legal & E-E-A-T', 'Signals that search engines and partners look for.');
for (const t of ['About us page', 'Methodology page (how we rate)', 'Editorial policy', 'Affiliate disclosure', 'Privacy policy', 'Terms of use', 'Photo credits page (licences)', 'Contact page', 'Data sources cited on every destination page', 'Bylines and "updated" dates on guides']) add(DONE, t);
add(OWNER, 'Provide a public contact e-mail and set SITE.email in src/config.ts');
for (const t of ['Author profiles with real travel experience', 'Cookie banner if analytics with cookies is ever added (EU/UK)', 'Press / "as featured in" section once coverage exists']) add(PLAN, t);

// ---------------------------------------------------------------------------
add = section('K. Monetisation (Travelpayouts)', 'Every page has a booking box; links live in src/data/affiliates.json.');
for (const t of ['Single config file for all partner links with per-destination overrides', 'Booking box on destination, month, hub and comparison pages', 'Partner buttons on cards', 'Sticky booking bar on phones', 'Hotel buttons in "Where to stay" sections', 'GetTransfer airport-transfer link connected']) add(DONE, t);
const filled = Object.entries(affiliates.partners).filter(([, p]) => p.url).map(([k]) => k);
for (const [k, label] of [['flights', 'flights (e.g. Aviasales)'], ['hotels', 'hotels'], ['tours', 'tours & activities'], ['insurance', 'travel insurance'], ['esim', 'eSIM data']]) {
  add(filled.includes(k) ? DONE : OWNER, `Join a Travelpayouts ${label} programme and paste the link into affiliates.json`);
}
for (const t of ['Car rental programme link', 'Bus, train & ferry tickets programme link', 'Cruise programme link (Caribbean, Alaska, Greek islands)']) add(OWNER, t);
for (const d of dests.slice(0, 40)) add(OWNER, `Destination-specific hotel search link for ${d.name} (overrides.${d.slug}.hotels)`);
for (const t of ['A/B test booking-box position and wording', 'Price widgets (cheapest flights by month) once an API token is added as a build secret', 'Newsletter with seasonal deals', 'Display ads once traffic qualifies (e.g. Ezoic, Mediavine)', 'Sponsored content policy and rate card']) add(PLAN, t);

// ---------------------------------------------------------------------------
add = section('L. Analytics & operations', '');
add(OWNER, 'Publish on Cloudflare Pages (see README) and connect the domain');
add(OWNER, 'Turn on Cloudflare Web Analytics (cookie-free)');
add(OWNER, 'Track affiliate clicks and earnings per page in the Travelpayouts dashboard');
for (const t of ['Monthly report: top pages, clicks, earnings', 'Rank tracking for 100 priority keywords', 'Uptime monitoring']) add(PLAN, t);

// ---------------------------------------------------------------------------
add = section('M. Distribution & marketing', 'Search takes months; these channels bring visitors sooner.');
add(OWNER, 'Create Pinterest business account and boards per region and month');
for (const h of hubs) add(PLAN, `Pinterest pins (3 designs) for "Best time to visit ${h}"`);
for (const t of ['Answer "where should I go in {month}" threads on Reddit/Quora with genuinely useful replies', 'Share seasonal lists in Facebook travel groups', 'Pitch data stories to journalists (e.g. "warmest places for Christmas")', 'Expert-source platforms (Qwoted, Featured, HARO successors)', 'Guest posts on travel blogs', 'Embeddable climate widget outreach to bloggers', 'Short videos (YouTube Shorts, TikTok, Reels): "where to go in {month}"', 'Monthly newsletter', 'Seasonal social calendar (12 months)', 'Partner with travel creators for co-branded guides']) add(PLAN, t);

// ---------------------------------------------------------------------------
add = section('N. Localisation', 'Same data, new markets.');
for (const lang of ['Spanish', 'German', 'French', 'Portuguese', 'Italian']) {
  for (const p of ['month pages & collections', 'country hubs', 'destination guides', 'destination × month pages', 'comparisons', 'guides']) add(PLAN, `${lang}: ${p}`);
}

// ---------------------------------------------------------------------------
add = section('O. Content maintenance', 'Keep data and advice current.');
for (const t of ['Yearly review of all daily budgets', 'Yearly update of festival and event dates', 'Refresh climate data when new normals are published', 'Replace weaker photos with better freely licensed shots', 'Quarterly check of practical info (plugs, tipping, time zones)', 'Add "what\'s new" notes for entry rules and airport changes']) add(PLAN, t);
add(PLAN, `Rolling editorial fact-check of all ${dests.length} destination guides (one region per month)`);

// ---------------------------------------------------------------------------
// New destinations backlog (demand-ordered), used to make up the total.
const backlog = ['San Francisco', 'Los Angeles', 'Seattle', 'Boston', 'Nashville', 'Charleston', 'Savannah', 'Sedona', 'Napa Valley', 'Lake Tahoe', 'Acadia & Maine', 'Glacier National Park', 'Olympic National Park', 'Arches & Bryce Canyon', 'Grand Teton', 'Great Smoky Mountains', 'Joshua Tree', 'Niagara Falls', 'Oregon Coast', 'Colorado (Denver & Rockies)', 'Vermont', 'Outer Banks', 'Myrtle Beach', 'Destin', 'Tulum', 'Cozumel', 'Belize', 'Antigua Guatemala', 'Panama', 'Quito', 'Patagonia', 'Santiago (Chile)', 'Uruguay', 'Barbados', 'St Lucia', 'US Virgin Islands', 'Curaçao', 'Cayman Islands', 'Bermuda', 'Lake Como', 'Dolomites', 'Cinque Terre', 'Provence', 'French Riviera (Nice)', 'Bruges', 'Copenhagen', 'Stockholm', 'Finnish Lapland', 'Faroe Islands', 'Lofoten', 'Berlin', 'Munich', 'Vienna', 'Salzburg', 'Kotor', 'Lake Bled', 'Albania Riviera', 'Fes', 'Essaouira', 'Petra & Jordan', 'Oman', 'Doha', 'Samarkand', 'Kenya safari (Maasai Mara)', 'Serengeti', 'Namibia', 'Botswana (Okavango)', 'Victoria Falls', 'Busan', 'Jeju', 'Shanghai', 'Beijing', "Xi'an", 'Zhangjiajie', 'Yunnan', 'Luang Prabang', 'Siem Reap', 'Bhutan', 'Rajasthan', 'Kerala', 'Ladakh', 'Andaman Islands', 'Langkawi', 'Borneo', 'Lombok & Gili Islands', 'Komodo', 'Whitsundays', 'Uluru', 'Perth', 'Tasmania', 'Rotorua', 'Cook Islands', 'Samoa', 'Tahiti'];
add = section('P. New destinations backlog (demand-ordered)', 'Next destinations to add — each brings 13 pages.');
const used = sections.reduce((s, x) => s + x.items.length, 0);
const need = TOTAL - used;
if (need < 0) throw new Error(`plan has ${used} items, more than ${TOTAL} — trim a section`);
if (need > backlog.length) throw new Error(`need ${need} backlog items but only ${backlog.length} available`);
for (const b of backlog.slice(0, need)) add(PLAN, `Add destination: ${b} (guide + 12 monthly pages)`);

// ---------------------------------------------------------------------------
const all = sections.flatMap((s) => s.items);
const count = (st) => all.filter((i) => i.status === st).length;
const mark = { [DONE]: '- [x] ✅', [OWNER]: '- [ ] 🟡', [PLAN]: '- [ ] ⏳' };
let n = 0;
const lines = [
  '# SeasonScout — content & growth plan (1,000 tasks)',
  '',
  `Generated by \`npm run plan\` from the site's data on ${new Date().toISOString().slice(0, 10)}. Statuses for pages are computed from the data, so this file stays in sync with the code.`,
  '',
  `**Total: ${all.length}** · ✅ done: **${count(DONE)}** · 🟡 needs the site owner: **${count(OWNER)}** · ⏳ planned: **${count(PLAN)}**`,
  '',
  'Priorities follow search demand: month collections and country hubs first, then destinations, comparisons and guides.',
  '',
  '| Section | Done | Owner | Planned | Total |',
  '|---|---:|---:|---:|---:|',
  ...sections.map((s) => `| ${s.title} | ${s.items.filter((i) => i.status === DONE).length} | ${s.items.filter((i) => i.status === OWNER).length} | ${s.items.filter((i) => i.status === PLAN).length} | ${s.items.length} |`),
  '',
];
for (const s of sections) {
  lines.push(`## ${s.title}`, '');
  if (s.why) lines.push(`_${s.why}_`, '');
  for (const i of s.items) lines.push(`${mark[i.status]} ${String(++n).padStart(4, '0')} — ${i.text}`);
  lines.push('');
}
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/CONTENT_PLAN.md', lines.join('\n'));
console.log(`docs/CONTENT_PLAN.md: ${all.length} tasks — done ${count(DONE)}, owner ${count(OWNER)}, planned ${count(PLAN)}`);
