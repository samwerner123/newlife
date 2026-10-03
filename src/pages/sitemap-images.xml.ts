import type { APIRoute } from 'astro';
import { destinations, hubs, MONTH_SLUGS } from '../lib/data';
import { ogImage, photo } from '../lib/images';

// Image sitemap: tells search engines which photo belongs to which page (destinations,
// their month pages, country hubs). Listed in robots.txt next to the main sitemap.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const abs = (p: string) => new URL(p, site).toString();
  const entries: string[] = [];
  const add = (page: string, slug: string, img: string) => {
    const credit = photo(slug)?.credit;
    entries.push(
      `<url><loc>${esc(abs(page))}</loc><image:image><image:loc>${esc(abs(img))}</image:loc>${
        credit ? `<image:license>${esc(credit.licenseUrl || credit.source)}</image:license>` : ''
      }</image:image></url>`,
    );
  };
  for (const d of destinations) {
    const img = await ogImage(d.slug);
    if (!img) continue;
    add(d.url, d.slug, img);
    for (const m of MONTH_SLUGS) add(`${d.url}${m}/`, d.slug, img);
  }
  for (const h of hubs) {
    const img = await ogImage(h.photo);
    if (img) add(h.url, h.photo, img);
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
