import type { APIRoute } from 'astro';
import { destinations, countryInfo } from '../../lib/data';

// Compact data for the packing-list generator.
// months: [high, low, rain mm, rainy days | null, sea °C | null, daylight hours] for each month.
export const GET: APIRoute = () => {
  const dests = destinations.map((d) => ({
    id: d.slug,
    name: d.name,
    country: d.country,
    climate: d.climate,
    currency: d.currency,
    tags: d.tags,
    plugs: countryInfo(d)?.plugs ?? '',
    ski: d.ski ? Object.keys(d.ski.months).map(Number) : [],
    months: d.months.map((m) => [Math.round(m.high), Math.round(m.low), m.rain, m.rainDays === null ? null : Math.round(m.rainDays), m.sea === null ? null : Math.round(m.sea), m.daylight]),
  }));
  return new Response(JSON.stringify(dests), { headers: { 'Content-Type': 'application/json' } });
};
