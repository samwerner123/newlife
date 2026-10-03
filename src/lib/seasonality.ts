// Estimated travel seasons (high / shoulder / low) for each destination and month.
// We have no booking data, so this is a transparent estimate built from the things that drive crowds and prices:
//  - the month's weather compared with the destination's own best and worst months,
//  - school and public holidays in the main source markets (summer holidays, Christmas, Easter, Golden Week),
//  - ski seasons and autumn-colour peaks, and seasonal closures (which empty a place out).
// The method is described for readers on /about/ — keep the two in sync.
import { skiStatus, foliageStatus, monthRanges, type Destination } from './data';

export type Season = 'high' | 'shoulder' | 'low';
export const SEASON_LABEL: Record<Season, string> = { high: 'High season', shoulder: 'Shoulder season', low: 'Low season' };
export const SEASON_SHORT: Record<Season, string> = { high: 'High', shoulder: 'Shoulder', low: 'Low' };
export const SEASON_NOTE: Record<Season, string> = {
  high: 'the busiest and most expensive time, so book early',
  shoulder: 'fewer crowds and mid-range prices',
  low: 'the quietest and cheapest time',
};

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const SOUTH = new Set(['Oceania', 'Central & South America']);

/** Demand index from 0 to 1 for a destination in a month (0 = January). */
export function demand(d: Destination, m: number): number {
  const scores = d.months.map((x) => x.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const mo = d.months[m];
  // Relative weather: a place's own best months draw the crowds, even if they only rate "good". Small differences
  // in places that are good all year (the Canaries, the tropics) shouldn't swing the season, hence the 25-point floor.
  let x = 0.7 * (1 - (max - mo.score) / Math.max(25, max - min));
  const southern = d.lat < -10 && (SOUTH.has(d.region) || d.country === 'South Africa');
  // Summer school holidays in Europe and North America (July–August), felt almost everywhere,
  // and most of all at family destinations.
  if (m === 6 || m === 7) x += (d.lat > 0 ? 0.25 : 0.1) + (d.tags.includes('family') ? 0.15 : 0);
  // Winter sun: warm places in the northern subtropics fill up with travellers escaping the cold (November–March).
  if ([10, 11, 0, 1, 2].includes(m) && mo.high >= 20 && d.lat > 0 && d.lat < 35) x += 0.15;
  // Southern-hemisphere summer holidays (December–January).
  if (southern && (m === 11 || m === 0)) x += 0.2;
  // Spring break and Easter in warm places; Golden Week in Japan.
  if ((m === 2 || m === 3) && mo.high >= 22) x += 0.1;
  if (d.country === 'Japan' && m === 4) x += 0.15;
  // Events that draw crowds whatever the weather set a floor.
  const floor = (v: number) => (x = Math.max(x, v));
  if (m === 11 && mo.high >= 24) floor(0.7); // Christmas and New Year in warm places
  if (m === 11 && d.tags.includes('city') && d.lat > 35) floor(0.45); // Christmas markets and city breaks
  if (d.country === 'Japan' && m === 3) floor(0.75); // cherry-blossom season
  const ski = skiStatus(d, m);
  if (ski === 'peak') floor(0.8);
  else if (ski === 'season') floor(0.6);
  else if (ski === 'early' || ski === 'late') floor(0.45);
  const leaves = foliageStatus(d, m);
  if (leaves === 'peak') floor(0.75);
  else if (leaves === 'early') x += 0.1;
  // Seasonal closures (lodges, roads, park buses) mean few visitors.
  if (mo.note && /clos/i.test(mo.note)) x -= 0.35;
  return clamp(x);
}

export function crowdLevel(d: Destination, m: number): Season {
  const x = demand(d, m);
  return x >= 0.65 ? 'high' : x >= 0.4 ? 'shoulder' : 'low';
}

/** "High season: June–August; low season: November–March" for a destination. */
export function seasonSummary(d: Destination): { high: string; shoulder: string; low: string } {
  const by = (s: Season) => monthRanges(d.months.map((x) => x.index).filter((m) => crowdLevel(d, m) === s));
  return { high: by('high'), shoulder: by('shoulder'), low: by('low') };
}
