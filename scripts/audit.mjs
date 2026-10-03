// Lighthouse (mobile) + axe-core (WCAG 2.1 AA, light & dark themes) over the key templates; results go to docs/AUDIT.md.
// Setup (not saved to package.json): npm i --no-save lighthouse@12 @axe-core/playwright playwright-core
// Usage: npm run build && npx astro preview --port 4321 &   then   node scripts/audit.mjs [lh|axe|all]
//   PAGES=/a/,/b/ node scripts/audit.mjs axe   — audit other pages; CHROME=<path> to use another Chromium.
// JSON reports are written to .audit/ (git-ignored).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';

const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://localhost:4321';
const PAGES = process.env.PAGES ? process.env.PAGES.split(',') : [
  '/',
  '/where-to-go-in-december/',
  '/warm-places-to-visit-in-january/',
  '/best-time-to-visit-thailand/',
  '/thailand-in-december/',
  '/destinations/vienna/',
  '/destinations/bali/january/',
  '/compare/maui-vs-oahu/',
  '/calendar/',
  '/destinations/',
  '/countries/',
  '/guides/whale-watching/',
  '/map/',
  '/trip-finder/',
];
const mode = process.argv[2] || 'all';
fs.mkdirSync('.audit', { recursive: true });

if (mode === 'lh' || mode === 'all') {
  const rows = [];
  for (const p of PAGES) {
    const file = `.audit/lh${p.replace(/\//g, '_') || '_'}.json`;
    try {
      execFileSync('npx', ['lighthouse', BASE + p, '--quiet', '--output=json', `--output-path=${file}`,
        '--only-categories=performance,accessibility,best-practices,seo',
        '--chrome-flags=--headless=new --no-sandbox --disable-gpu'], { env: { ...process.env, CHROME_PATH: CHROME }, stdio: 'pipe', timeout: 240000 });
    } catch (e) { console.error(p, e.message.slice(0, 200)); continue; }
    const r = JSON.parse(fs.readFileSync(file, 'utf8'));
    const c = r.categories, a = r.audits;
    const fails = Object.values(a).filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'manual' && x.scoreDisplayMode !== 'notApplicable').map((x) => `${x.id}(${x.score})`);
    const row = { p, perf: Math.round(c.performance.score * 100), a11y: Math.round(c.accessibility.score * 100), bp: Math.round(c['best-practices'].score * 100), seo: Math.round(c.seo.score * 100),
      lcp: a['largest-contentful-paint'].displayValue, cls: a['cumulative-layout-shift'].displayValue, tbt: a['total-blocking-time'].displayValue, fails };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  fs.writeFileSync('.audit/lh-summary.json', JSON.stringify(rows, null, 2));
}

if (mode === 'axe' || mode === 'all') {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const out = [];
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ colorScheme: theme, viewport: { width: 390, height: 844 } });
    await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t); } catch {} }, theme);
    for (const p of PAGES) {
      const page = await ctx.newPage();
      await page.goto(BASE + p, { waitUntil: 'networkidle' });
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const v = res.violations.map((x) => ({ id: x.id, impact: x.impact, n: x.nodes.length, sample: x.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n').slice(1, 2).join('')) }));
      out.push({ theme, p, violations: v });
      console.log(theme, p, v.length ? v.map((x) => `${x.id}×${x.n}`).join(', ') : 'OK');
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync('.audit/axe-summary.json', JSON.stringify(out, null, 2));
}
