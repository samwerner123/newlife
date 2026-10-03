// Generates docs/CONTENT_PLAN.md — the content & growth plan.
// Statuses are computed from the actual site (data files, pages, scripts), so the plan never drifts:
//   [x] ✅ done   ·   [ ] 🟡 needs the site owner   ·   [ ] ⏳ planned
// Usage: node scripts/build-plan.mjs
import fs from 'node:fs';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const text = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
const exists = (p) => fs.existsSync(p);
const dests = read('src/data/destinations.json');
const climate = read('src/data/climate.json');
const images = read('src/data/images.json');
const pairs = read('src/data/comparisons.json');
const affiliates = read('src/data/affiliates.json');
const sea = read('src/data/sea.json');
const config = text('src/config.ts');
const collectionsSrc = text('src/lib/collections.ts');
const guidesSrc = text('src/lib/guides.ts');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const slugs = new Set(dests.map((d) => d.slug));
const nameOf = (id) => (id.startsWith('hub:') ? id.slice(4) : dests.find((d) => d.slug === id)?.name ?? id);

const hubCount = {};
for (const d of dests) for (const h of [].concat(d.hub ?? [])) hubCount[h] = (hubCount[h] || 0) + 1;
const hubs = Object.keys(hubCount).filter((h) => hubCount[h] >= 2).sort((a, b) => a.localeCompare(b));
const guides = [...guidesSrc.matchAll(/\{ slug: '([^']+)', title: '([^']+)'/g)].map((m) => ({ slug: m[1], title: m[2].replace(/’/g, "'") }));

const DONE = 'done';
const OWNER = 'owner';
const PLAN = 'plan';
const sections = [];
const section = (title, why) => {
  const s = { title, why, items: [] };
  sections.push(s);
  return (status, t) => s.items.push({ status, text: t });
};
const done = (cond) => (cond ? DONE : PLAN);

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
add(DONE, 'Validate demand for 120 more destinations and 38 regional hubs ("best time to visit Scandinavia", "Southeast Asia", "the Caribbean"…)');
add(DONE, 'Validate demand for "where to ski in {month}", "warm places to go for Christmas" and "best Christmas markets in Europe"');
add(done(exists('scripts/find-comparisons.mjs')), 'Repeatable comparison research: scripts/find-comparisons.mjs (Google autocomplete "X vs …")');
add(/url: 'https:\/\/seasonscout\.pages\.dev'/.test(config) ? OWNER : DONE, 'Pick and register the final domain (.com), then set it in src/config.ts');
add(PLAN, 'Re-run demand research every quarter and re-rank the backlog');
add(PLAN, 'Get real search volumes from Google Search Console after 3 months of data and re-prioritise');
add(PLAN, 'Track which page types earn the most affiliate clicks and double down on them');

// ---------------------------------------------------------------------------
const collections = [
  ['Best places to travel in', 'where-to-go-in-'],
  ['Warm places to visit in', "key: 'warm'"],
  ['Warm places to visit in the US in', "key: 'us-warm'"],
  ['Warmest places in Europe in', "key: 'europe-warm'"],
  ['Beach vacations in', "key: 'beach'"],
  ['Cheap places to travel in', "key: 'cheap'"],
  ['Best places to travel in the US in', "key: 'us-best'"],
  ['Best places to visit in Europe in', "'europe', 'Europe'"],
  ['Best places to visit in Asia in', "'asia', 'Asia'"],
  ['Best places to visit in the Caribbean in', "'caribbean', 'Caribbean'"],
  ['Best places to visit in South America in', "'south-america'"],
  ['Best places to visit in Africa in', "'africa', 'Africa'"],
  ['Where to ski in', "key: 'ski'"],
  ['Best places to visit in the Middle East in', "'middle-east'"],
  ['Best places to visit in Central America in', "'central-america'"],
  ['Best places to visit in Oceania in', "'oceania', 'Oceania'"],
  ['Romantic getaways in', "key: 'romantic'"],
  ['Best national parks to visit in', "key: 'national-parks'"],
];
add = section('B. Month collections (highest search demand)', '"Best places to travel in October", "warm places to visit in December", "where to ski in July"…');
for (const [label, marker] of collections) {
  const ok = marker === 'where-to-go-in-' ? exists('src/pages/where-to-go-in-[month].astro') : collectionsSrc.includes(marker);
  for (const m of MONTHS) add(done(ok), `${label} ${m}`);
}
add(done(exists('src/pages/christmas-destinations.astro')), 'Christmas & New Year destinations (warm, snowy and festive picks)');
add(done(collectionsSrc.includes("key: 'foliage'")), 'Where to see fall foliage in {month} — the months with autumn colours somewhere (April–May, September–December)');

// ---------------------------------------------------------------------------
add = section('C. Country, state & region hubs', '"Best time to visit Thailand", "Thailand in December", "best time to visit the Caribbean"…');
for (const h of hubs) add(DONE, `Best time to visit ${h} — hub page with seasons, month table, heatmap, FAQ`);
for (const h of hubs) for (const m of MONTHS) add(DONE, `${h} in ${m}`);
for (const h of ['the Mediterranean', 'the Canary Islands', 'Eastern Europe', 'Patagonia (Argentina & Chile)', 'the Indian Ocean islands', 'the Florida Gulf Coast']) {
  add(PLAN, `Hub: best time to visit ${h} (needs 2+ destinations)`);
}

// ---------------------------------------------------------------------------
add = section('D. Destination guides', 'Each = destination page + 12 month pages + climate data + photo + stay areas + practical info.');
for (const d of dests) {
  const ok = climate[d.slug] && images[d.slug] && d.stay?.length === 3 && d.tz;
  add(ok ? DONE : PLAN, `${d.name} — guide, 12 monthly pages, climate, photo, where to stay, practical info`);
}
add(done(Object.values(sea).filter(Boolean).length > 100), `Sea temperature by month for ${Object.values(sea).filter(Boolean).length} coastal destinations`);
add(done(dests.some((d) => d.ski)), `Ski season calendar for ${dests.filter((d) => d.ski).length} ski destinations`);

// ---------------------------------------------------------------------------
add = section('E. Comparisons ("X vs Y")', 'Only pairs with proven search demand.');
for (const [a, b] of pairs) add(DONE, `${nameOf(a)} vs ${nameOf(b)}`);
add(done(exists('src/pages/compare/custom.astro')), 'Compare any two destinations on demand (/compare/custom/)');

// ---------------------------------------------------------------------------
add = section('F. Seasonal & evergreen guides', 'Long-form content that earns links and ranks for seasonal queries.');
for (const g of guides) add(done(exists(`src/pages/guides/${g.slug}.astro`)), `Guide: ${g.title}`);
for (const g of ['Best time to visit Europe: a month-by-month guide', 'Thailand islands: Andaman coast vs Gulf of Thailand by season', 'Costa Rica green season: is it worth it?', 'Cheapest months to fly to Europe from the US', 'Wildflower seasons: deserts, Alps and Namaqualand', 'Carnival season: Rio, Venice, Trinidad, New Orleans', 'Where to go for Easter', 'Best places for stargazing and dark skies', 'Rainy season in Mexico and Central America', 'Best road trips by season', 'Solo travel: safe, sunny places by month', 'Where to celebrate Halloween and Día de los Muertos']) {
  add(PLAN, `Guide: ${g}`);
}

// ---------------------------------------------------------------------------
add = section('G. Tools & UX features', 'What professional travel sites offer beyond articles.');
for (const t of ['Site search (destinations, countries, months, comparisons, guides)', '°C/°F and mm/inch switch (auto °F for US visitors)', 'Filters & sorting on lists (region, temperature, budget, weather)', 'Travel calendar heatmap (all destinations × 12 months)', 'Month strip with tooltips on every card', 'Climate charts (temperature range + rainfall) with table view', 'Comparison chart (two places, 12 months)', 'Trip cost estimator', 'Mobile hamburger menu', 'Sticky mobile booking bar', 'Collapsible filters on phones', 'Quick links to related collections on every month page']) add(DONE, t);
const header = text('src/components/Header.astro');
const base = text('src/layouts/Base.astro');
add(done(exists('src/pages/trip-finder.astro')), 'Trip-finder quiz (month, temperature, budget, interests)');
add(done(exists('src/pages/map.astro')), 'Interactive world map coloured by weather score');
add(done(exists('src/pages/compare/custom.astro')), 'Compare any two destinations on demand');
add(done(exists('src/pages/saved.astro') && base.includes("read('saved')")), 'Save favourites (local)');
add(done(base.includes("write('recent'")), 'Recently viewed destinations');
add(done(header.includes('data-theme-toggle')), 'Light/dark theme switch');
add(done(text('src/styles/global.css').includes('@media print')), 'Print-friendly destination fact sheet');
add(done(exists('src/components/Share.astro')), 'Share buttons (Pinterest, WhatsApp, X, Facebook, e-mail, copy link)');
add(done(text('src/lib/data.ts').includes('monthDaylight') && Object.values(sea).some(Boolean)), 'Daylight hours & sea temperature data');
add(done(exists('src/pages/embed/[slug].astro')), 'Embeddable climate widget for bloggers (backlinks)');
add(done(exists('src/pages/api/destinations.json.ts')), 'Compact JSON data endpoint for the client-side tools');
add(OWNER, 'Flight price calendar per destination (needs a Travelpayouts Data API token as a build secret)');
add(OWNER, '"Notify me when it\'s the best time" e-mail alerts (needs an e-mail provider account)');
for (const t of ['Crowd & price seasonality indicators', 'Per-month photo galleries', 'Weather-score explainer tooltips on every badge', 'Packing-list generator from the month’s weather']) add(PLAN, t);

// ---------------------------------------------------------------------------
add = section('H. Mobile, performance & accessibility', 'Most travel searches happen on phones.');
const pageTypes = ['Home', 'Month page', 'Month collection', 'Country hub', 'Country × month', 'Destination', 'Destination × month', 'Comparison', 'Calendar', 'Destinations list', 'Countries list', 'Guide'];
for (const p of pageTypes) add(DONE, `${p}: no horizontal scroll and readable layout at 320, 360, 390, 414, 768, 1024 and 1366 px`);
for (const t of ['Tap targets ≥ 44 px (pills, chips, buttons, month cells on touch screens)', 'Sticky first column in wide tables on phones', 'Responsive WebP images with srcset and lazy loading', 'Hero images load eagerly with high priority (LCP)', 'Static HTML, minimal JavaScript, no web fonts', 'Long-term caching for hashed assets', 'Light and dark colour schemes', 'Colour-blind-safe rating scale with text labels', 'Keyboard-accessible tooltips, search and menus', 'Skip link and semantic landmarks']) add(DONE, t);
const audit = text('docs/AUDIT.md');
add(done(/Lighthouse/.test(audit)), 'Lighthouse audit on key templates and fix regressions (docs/AUDIT.md)');
add(done(/axe/.test(audit)), 'Automated accessibility audit (axe-core) on key templates');
add(OWNER, 'Real-user Core Web Vitals monitoring (turn on Cloudflare Web Analytics)');
add(PLAN, 'Manual screen-reader test pass (VoiceOver, TalkBack)');
add(done(/HTML weight/.test(audit)), 'Reduce HTML weight of the heaviest pages');
add(done(exists('public/sw.js')), 'Offline-friendly cache for recently viewed pages (service worker)');

// ---------------------------------------------------------------------------
add = section('I. Technical SEO', 'Make every page discoverable and understood.');
for (const t of ['XML sitemap for every page', 'robots.txt with sitemap link', 'Canonical URLs and consistent trailing slashes', 'Unique titles (≤ 60 chars where possible) and meta descriptions', 'BreadcrumbList structured data', 'FAQPage structured data on hubs, collections and comparisons', 'ItemList structured data on ranked lists', 'Article structured data on guides', 'TouristDestination structured data', 'Open Graph + Twitter cards with per-page images', 'Default social image', 'Web app manifest and touch icons', 'Security headers', 'Internal linking: month ↔ collections ↔ countries ↔ destinations ↔ comparisons', '404 page with helpful links', 'Rel="sponsored nofollow" on all affiliate links', 'Year in titles of month pages (auto-updated on each build)']) add(DONE, t);
add(done(exists('src/pages/sitemap-images.xml.ts')), 'Image sitemap (listed in robots.txt)');
add(done(exists('scripts/indexnow.mjs') && fs.readdirSync('public').some((f) => /^[0-9a-f]{32}\.txt$/.test(f))), 'IndexNow key file and ping script (npm run indexnow)');
add(done(exists('scripts/check-site.mjs') && exists('.github/workflows/ci.yml')), 'Automated broken-link, structured-data and page-basics check in CI');
add(done(exists('.github/workflows/monthly-rebuild.yml')), 'Monthly rebuild workflow so "next {month}" years and seasonal links stay fresh');
add(done(text('astro.config.mjs').includes('filter')), 'Keep noindex pages (embeds, saved places) out of the sitemap');
add(OWNER, 'Connect the site to Google Search Console and submit both sitemaps');
add(OWNER, 'Connect Bing Webmaster Tools (also feeds DuckDuckGo, Yahoo, ChatGPT search)');
add(OWNER, 'Add the CF_DEPLOY_HOOK and SITE_URL repository secrets to switch on the monthly rebuild, IndexNow pings and uptime checks');
add(OWNER, 'Spot-check each template in Google’s Rich Results Test after launch');
add(PLAN, 'hreflang tags once translations launch');
add(PLAN, 'Monitor index coverage and fix excluded pages');

// ---------------------------------------------------------------------------
add = section('J. Trust, legal & E-E-A-T', 'Signals that search engines and partners look for.');
for (const t of ['About us page', 'Methodology page (how we rate)', 'Editorial policy', 'Affiliate disclosure', 'Privacy policy', 'Terms of use', 'Photo credits page (licences)', 'Contact page', 'Data sources cited on every destination page', 'Bylines and "updated" dates on guides']) add(DONE, t);
add(done(exists('src/pages/advertise.astro')), 'Sponsored content policy and advertising page');
add(/email: ''/.test(config) ? OWNER : DONE, 'Provide a public contact e-mail and set SITE.email in src/config.ts');
add(OWNER, 'Author profiles with real travel experience (real people only)');
add(PLAN, 'Cookie banner if analytics with cookies is ever added (EU/UK) — not needed while analytics stay cookie-free');
add(PLAN, 'Press / "as featured in" section once coverage exists');

// ---------------------------------------------------------------------------
add = section('K. Monetisation (Travelpayouts)', 'Every page has a booking box; links live in src/data/affiliates.json.');
for (const t of ['Single config file for all partner links with per-destination overrides', 'Booking box on destination, month, hub and comparison pages', 'Partner buttons on cards', 'Sticky booking bar on phones', 'Hotel buttons in "Where to stay" sections', 'GetTransfer airport-transfer link connected']) add(DONE, t);
add(done(exists('src/pages/guides/travel-insurance.astro') && exists('src/pages/guides/esim-travel.astro')), 'Travel-insurance and eSIM guides with partner slots (buttons appear once links are added)');
const filled = Object.entries(affiliates.partners).filter(([, p]) => p.url).map(([k]) => k);
for (const [k, label] of [['flights', 'flights (e.g. Aviasales)'], ['hotels', 'hotels'], ['tours', 'tours & activities'], ['insurance', 'travel insurance'], ['esim', 'eSIM data']]) {
  add(filled.includes(k) ? DONE : OWNER, `Join a Travelpayouts ${label} programme and paste the link into affiliates.json`);
}
for (const t of ['Car rental programme link', 'Bus, train & ferry tickets programme link', 'Cruise programme link (Caribbean, Alaska, Greek islands)']) add(OWNER, t);
// Highest-demand destinations first (autocomplete research).
const DEMAND = ['oahu', 'maui', 'kauai', 'big-island', 'iceland', 'guanacaste', 'manuel-antonio', 'miami', 'orlando', 'key-west', 'puerto-rico', 'bahamas', 'aruba', 'turks-and-caicos', 'jamaica', 'punta-cana', 'cancun', 'cabo-san-lucas', 'puerto-vallarta', 'bali', 'phuket', 'krabi', 'koh-samui', 'bangkok', 'tokyo', 'kyoto', 'santorini', 'crete', 'mykonos', 'amalfi-coast', 'rome', 'venice', 'florence', 'lisbon', 'algarve', 'madeira', 'mallorca', 'barcelona', 'dubai', 'maldives'];
for (const slug of DEMAND) {
  const d = dests.find((x) => x.slug === slug);
  if (d) add(affiliates.overrides[slug]?.hotels ? DONE : OWNER, `Destination-specific hotel search link for ${d.name} (overrides.${d.slug}.hotels)`);
}
for (const t of ['A/B test booking-box position and wording', 'Price widgets (cheapest flights by month) once an API token is added as a build secret', 'Newsletter with seasonal deals', 'Display ads once traffic qualifies (e.g. Ezoic, Mediavine)']) add(PLAN, t);

// ---------------------------------------------------------------------------
add = section('L. Analytics & operations', '');
add(OWNER, 'Publish on Cloudflare Pages (see README) and connect the domain');
add(OWNER, 'Turn on Cloudflare Web Analytics (cookie-free)');
add(OWNER, 'Track affiliate clicks and earnings per page in the Travelpayouts dashboard');
add(done(exists('.github/workflows/uptime.yml')), 'Uptime monitoring (GitHub Actions every 6 hours; needs the SITE_URL secret)');
for (const t of ['Monthly report: top pages, clicks, earnings', 'Rank tracking for 100 priority keywords']) add(PLAN, t);

// ---------------------------------------------------------------------------
add = section('M. Distribution & marketing', 'Search takes months; these channels bring visitors sooner.');
add(OWNER, 'Create Pinterest business account and boards per region and month');
add(done(exists('scripts/make-pins.mjs')), `Pinterest pin generator: 3 designs for each of the ${hubs.length} country and region hubs (npm run pins)`);
add(OWNER, 'Upload the generated pins to Pinterest boards, 3–5 a day, 6–8 weeks ahead of each season');
add(done(exists('marketing/social-calendar.md')), 'Seasonal social calendar (12 months)');
add(done(exists('marketing/press-pitches.md')), 'Data-story pitches for journalists (e.g. "warmest places for Christmas")');
add(done(exists('marketing/outreach.md')), 'Outreach templates: embeddable widget, guest posts, expert sources');
for (const t of ['Answer "where should I go in {month}" threads on Reddit/Quora with genuinely useful replies', 'Share seasonal lists in Facebook travel groups', 'Expert-source platforms (Qwoted, Featured, HARO successors)', 'Guest posts on travel blogs', 'Short videos (YouTube Shorts, TikTok, Reels): "where to go in {month}"', 'Monthly newsletter', 'Partner with travel creators for co-branded guides']) add(OWNER, t);

// ---------------------------------------------------------------------------
add = section('N. Localisation', 'Same data, new markets.');
for (const lang of ['Spanish', 'German', 'French', 'Portuguese', 'Italian']) {
  for (const p of ['month pages & collections', 'country hubs', 'destination guides', 'destination × month pages', 'comparisons', 'guides']) add(PLAN, `${lang}: ${p}`);
}

// ---------------------------------------------------------------------------
add = section('O. Content maintenance', 'Keep data and advice current.');
for (const t of ['Yearly review of all daily budgets', 'Yearly update of festival and event dates', 'Refresh climate data when new normals are published', 'Replace weaker photos with better freely licensed shots', 'Quarterly check of practical info (plugs, tipping, time zones)', 'Add "what\'s new" notes for entry rules and airport changes', 'Refresh sea temperatures every year (npm run sea)']) add(PLAN, t);
add(PLAN, `Rolling editorial fact-check of all ${dests.length} destination guides (one region per month)`);

// ---------------------------------------------------------------------------
// New destinations, demand-ordered: [label, slug]. Done once the slug exists in destinations.json.
const backlog = [
  ['San Francisco', 'san-francisco'], ['Los Angeles', 'los-angeles'], ['Seattle', 'seattle'], ['Boston', 'boston'], ['Nashville', 'nashville'], ['Charleston', 'charleston'], ['Savannah', 'savannah'], ['Sedona', 'sedona'], ['Napa Valley', 'napa-valley'], ['Lake Tahoe', 'lake-tahoe'], ['Acadia & Maine', 'acadia'], ['Glacier National Park', 'glacier-national-park'], ['Olympic National Park', 'olympic-national-park'], ['Arches & Bryce Canyon', 'arches-bryce'], ['Grand Teton', 'grand-teton'], ['Great Smoky Mountains', 'great-smoky-mountains'], ['Joshua Tree', 'joshua-tree'], ['Niagara Falls', 'niagara-falls'], ['Oregon Coast', 'oregon-coast'], ['Colorado (Denver & Rockies)', 'colorado'], ['Vermont', 'vermont'], ['Outer Banks', 'outer-banks'], ['Myrtle Beach', 'myrtle-beach'], ['Destin', 'destin'], ['Park City', 'park-city'], ['Whistler', 'whistler'],
  ['Tulum', 'tulum'], ['Cozumel', 'cozumel'], ['Belize', 'belize'], ['Antigua Guatemala', 'antigua-guatemala'], ['Panama', 'panama'], ['Barbados', 'barbados'], ['St Lucia', 'st-lucia'], ['US Virgin Islands', 'us-virgin-islands'], ['Curaçao', 'curacao'], ['Cayman Islands', 'cayman-islands'], ['Bermuda', 'bermuda'],
  ['Quito', 'quito'], ['Salvador da Bahia', 'salvador-brazil'], ['Amazon Rainforest', 'amazon'], ['Iguazu Falls', 'iguazu-falls'], ['Patagonia', 'patagonia'], ['Mendoza', 'mendoza'], ['Bariloche', 'bariloche'], ['Santiago (Chile)', 'santiago-chile'], ['Atacama Desert', 'atacama'], ['Torres del Paine', 'torres-del-paine'], ['Uruguay', 'uruguay'], ['Salar de Uyuni', 'uyuni'],
  ['Fes', 'fes'], ['Essaouira', 'essaouira'], ['Kruger National Park', 'kruger'], ['Serengeti', 'serengeti'], ['Mount Kilimanjaro', 'kilimanjaro'], ['Maasai Mara', 'maasai-mara'], ['Diani Beach', 'diani'], ['Namibia', 'namibia'], ['Okavango Delta', 'okavango'], ['Victoria Falls', 'victoria-falls'], ['Petra & Jordan', 'jordan'], ['Oman', 'oman'], ['Doha', 'doha'],
  ['Provence', 'provence'], ['French Riviera (Nice)', 'french-riviera'], ['Chamonix', 'chamonix'], ['Strasbourg', 'strasbourg'], ['Bruges', 'bruges'], ['Berlin', 'berlin'], ['Munich', 'munich'], ['Vienna', 'vienna'], ['Salzburg & Hallstatt', 'salzburg'], ['Innsbruck & the Tyrol', 'innsbruck'], ['Copenhagen', 'copenhagen'], ['Stockholm', 'stockholm'], ['Finnish Lapland', 'lapland'], ['Lofoten', 'lofoten'], ['Faroe Islands', 'faroe-islands'], ['Lake Como', 'lake-como'], ['Dolomites', 'dolomites'], ['Cinque Terre', 'cinque-terre'], ['Kotor', 'kotor'], ['Lake Bled', 'lake-bled'], ['Albania Riviera', 'albania'], ['Azores', 'azores'], ['Ibiza', 'ibiza'], ['Rhodes', 'rhodes'], ['Naxos', 'naxos'],
  ['Lombok & Gili Islands', 'lombok'], ['Komodo', 'komodo'], ['Yogyakarta', 'yogyakarta'], ['Rajasthan', 'rajasthan'], ['Kerala', 'kerala'], ['Ladakh', 'ladakh'], ['Boracay', 'boracay'], ['Cebu & Bohol', 'cebu'], ['Siargao', 'siargao'], ['Langkawi', 'langkawi'], ['Penang', 'penang'], ['Borneo', 'borneo'], ['Beijing', 'beijing'], ['Shanghai', 'shanghai'], ["Xi'an", 'xian'], ['Zhangjiajie', 'zhangjiajie'], ['Yunnan', 'yunnan'], ['Busan', 'busan'], ['Jeju', 'jeju'], ['Siem Reap', 'siem-reap'], ['Phnom Penh', 'phnom-penh'], ['Luang Prabang', 'luang-prabang'], ['Ha Long Bay', 'ha-long-bay'], ['Phu Quoc', 'phu-quoc'], ['Osaka', 'osaka'], ['Bhutan', 'bhutan'], ['Samarkand & Uzbekistan', 'uzbekistan'],
  ['Tasmania', 'tasmania'], ['Uluru', 'uluru'], ['Perth', 'perth'], ['Whitsundays', 'whitsundays'], ['Rotorua', 'rotorua'], ['Cook Islands', 'cook-islands'], ['Tahiti & Moorea', 'tahiti'],
  // Next up.
  ['Andaman Islands', 'andaman-islands'], ['Samoa', 'samoa'], ['Hoi An', 'hoi-an'], ['Koh Phangan & Koh Tao', 'koh-phangan'], ['Mount Fuji & Hakone', 'mount-fuji'], ['Hiroshima & Miyajima', 'hiroshima'], ['Pokhara', 'pokhara'], ['Raja Ampat', 'raja-ampat'], ['Madagascar', 'madagascar'], ['Rwanda (gorillas)', 'rwanda'], ['Abu Dhabi', 'abu-dhabi'], ['Cape Verde', 'cape-verde'], ['Puglia', 'puglia'], ['Sardinia', 'sardinia'], ['Cyprus', 'cyprus'], ['Granada & Andalusia', 'granada'], ['Normandy', 'normandy'], ['Bergen & the fjords', 'bergen'], ['Tallinn', 'tallinn'], ['Cornwall', 'cornwall'], ['Austin', 'austin'], ['San Antonio', 'san-antonio'], ['Philadelphia', 'philadelphia'], ['Hilton Head', 'hilton-head'], ['St. Augustine', 'st-augustine'], ['Big Sur', 'big-sur'], ['Death Valley', 'death-valley'], ['Mount Rainier', 'mount-rainier'], ['Denali', 'denali'], ['San Miguel de Allende', 'san-miguel-de-allende'], ['Isla Mujeres', 'isla-mujeres'], ['Roatán', 'roatan'], ['Easter Island', 'easter-island'], ['Gold Coast', 'gold-coast'], ['Great Ocean Road', 'great-ocean-road'], ['Milford Sound', 'milford-sound'],
];
add = section('P. New destinations backlog (demand-ordered)', 'Next destinations to add — each brings 13 pages.');
for (const [label, slug] of backlog) add(done(slugs.has(slug)), `Add destination: ${label} (guide + 12 monthly pages)`);

// ---------------------------------------------------------------------------
const all = sections.flatMap((s) => s.items);
const count = (st) => all.filter((i) => i.status === st).length;
const mark = { [DONE]: '- [x] ✅', [OWNER]: '- [ ] 🟡', [PLAN]: '- [ ] ⏳' };
let n = 0;
const lines = [
  '# SeasonScout — content & growth plan',
  '',
  `Generated by \`npm run plan\` from the site's data on ${new Date().toISOString().slice(0, 10)}. Statuses are computed from the data, pages and scripts, so this file stays in sync with the code.`,
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
