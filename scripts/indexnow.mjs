// Pings IndexNow (Bing, Yandex, Seznam, Naver…) with the site's URLs so new and updated pages are
// crawled quickly. Reads the live sitemap, so run it after a deploy.
//   node scripts/indexnow.mjs                 all URLs in the sitemap
//   node scripts/indexnow.mjs /path/ /other/  only these paths
// The key file public/<key>.txt must be deployed at the site root.
import fs from 'node:fs';

const site = (process.env.SITE_URL || fs.readFileSync('src/config.ts', 'utf8').match(/url:\s*'([^']+)'/)[1]).replace(/\/$/, '');
const keyFile = fs.readdirSync('public').find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error('No IndexNow key file (public/<32 hex chars>.txt)');
const key = keyFile.replace('.txt', '');

async function sitemapUrls() {
  const index = await (await fetch(`${site}/sitemap-index.xml`)).text();
  const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const urls = [];
  for (const m of maps) urls.push(...[...(await (await fetch(m)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]));
  return urls;
}

const args = process.argv.slice(2);
const urls = args.length ? args.map((p) => new URL(p, site).toString()) : await sitemapUrls();
const host = new URL(site).host;
for (let i = 0; i < urls.length; i += 10000) {
  const batch = urls.slice(i, i + 10000);
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation: `${site}/${keyFile}`, urlList: batch }),
  });
  console.log(`IndexNow: submitted ${batch.length} URLs for ${host} → HTTP ${res.status}`);
  if (res.status >= 400) process.exitCode = 1;
}
