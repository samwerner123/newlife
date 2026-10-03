import type { APIRoute } from 'astro';
import { destinations, hubs, MONTHS, monthUrl } from '../lib/data';
import { comparisons } from '../lib/compare';
import { COLLECTIONS } from '../lib/collections';
import { GUIDES } from '../lib/guides';

// Small client-side search index: [title, url, kind, hint].
export const GET: APIRoute = () => {
  const items: [string, string, string, string][] = [
    ...destinations.map((d): [string, string, string, string] => [d.name, d.url, 'Destination', d.country]),
    ...hubs.map((h): [string, string, string, string] => [`Best time to visit ${h.name}`, h.url, 'Country', `${h.members.length} destinations`]),
    ...MONTHS.map((m, i): [string, string, string, string] => [`Where to go in ${m}`, monthUrl(i), 'Month', 'Best places to travel']),
    ...COLLECTIONS.flatMap((c) => MONTHS.map((m, i): [string, string, string, string] => [c.h1(m), c.path(i), 'Ideas', m])),
    ...comparisons.map((c): [string, string, string, string] => [`${c.a.name} vs ${c.b.name}`, c.url, 'Compare', '']),
    ...GUIDES.map((g): [string, string, string, string] => [g.title, `/guides/${g.slug}/`, 'Guide', '']),
  ];
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
};
