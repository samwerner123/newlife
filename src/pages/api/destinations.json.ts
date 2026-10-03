import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { destinations, hubs, monthRanges, MONTH_SHORT } from '../../lib/data';
import { photo } from '../../lib/images';

// Compact data for the client-side tools (trip finder, custom compare, saved places, map).
// months: [score, high, low, rain] for each month.
export const GET: APIRoute = async () => {
  const dests = await Promise.all(
    destinations.map(async (d) => {
      const p = photo(d.slug);
      const thumb = p ? (await getImage({ src: p.src, width: 400, format: 'webp', quality: 60 })).src : '';
      return {
        id: d.slug,
        name: d.name,
        country: d.country,
        region: d.region,
        url: d.url,
        tags: d.tags,
        budget: [d.budget.low, d.budget.mid],
        lat: d.lat,
        lon: d.lon,
        best: monthRanges(d.bestMonths, MONTH_SHORT),
        ski: d.ski ? Object.keys(d.ski.months).map(Number) : [],
        months: d.months.map((m) => [m.score, Math.round(m.high), Math.round(m.low), m.rain]),
        thumb,
      };
    }),
  );
  const hubList = hubs.map((h) => ({
    id: `hub:${h.name}`,
    name: h.name,
    url: h.url,
    members: h.members.map((d) => d.slug),
    months: h.months.map((m) => [m.score, Math.round(m.high), Math.round(m.low), m.rain]),
  }));
  return new Response(JSON.stringify({ dests, hubs: hubList }), { headers: { 'Content-Type': 'application/json' } });
};
