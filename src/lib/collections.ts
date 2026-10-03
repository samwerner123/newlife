// Month-based collections that match high-demand searches, e.g.
// "warm places to visit in December", "cheap places to travel in March".
import { destinations, rankForMonth, isUS, MONTH_SLUGS, type Destination } from './data';

export interface Collection {
  key: string;
  label: string;
  path: (m: number) => string;
  title: (month: string, year: number) => string;
  h1: (month: string) => string;
  lead: (month: string, items: Destination[], m: number) => string;
  /** Ranked destinations for the month. */
  pick: (m: number) => Destination[];
  /** Which number to show in the "at a glance" table. */
  metric: 'score' | 'high' | 'budget';
}

const good = (d: Destination, m: number) => d.months[m].score >= 65;
const names = (ds: Destination[], n = 3) => ds.slice(0, n).map((d) => d.name).join(', ');

/** Keep at least `min` entries so a page is never thin: top up with the next-best fair-weather picks. */
function atLeast(list: Destination[], pool: Destination[], min = 4) {
  if (list.length >= min) return list;
  const extra = pool.filter((d) => !list.includes(d)).slice(0, min - list.length);
  return [...list, ...extra];
}

export const COLLECTIONS: Collection[] = [
  {
    key: 'warm',
    label: 'Warm places',
    path: (m) => `/warm-places-to-visit-in-${MONTH_SLUGS[m]}/`,
    title: (mn, y) => `Warm Places to Visit in ${mn} ${y}: Where It's Sunny`,
    h1: (mn) => `Warm places to visit in ${mn}`,
    lead: (mn, items, m) =>
      `Looking for sunshine in ${mn}? ${names(items)} lead our list of warm, well-rated destinations, with average highs of ${Math.round(
        items[0].months[m].high,
      )}°C and up. Every pick has a good or great weather score for ${mn}.`,
    pick: (m) => {
      const ranked = rankForMonth(m);
      return atLeast(
        ranked.filter((d) => good(d, m) && d.months[m].high >= 24),
        ranked.filter((d) => d.months[m].high >= 24),
      );
    },
    metric: 'high',
  },
  {
    key: 'us-warm',
    label: 'Warm in the USA',
    path: (m) => `/warm-places-to-visit-in-the-us-in-${MONTH_SLUGS[m]}/`,
    title: (mn, y) => `Warm Places to Visit in the US in ${mn} ${y}`,
    h1: (mn) => `Warm places to visit in the US in ${mn}`,
    lead: (mn, items) =>
      `The warmest well-rated US destinations in ${mn}: ${names(items)}. We compare average temperatures, rain and daily costs across Hawaii, Florida, Puerto Rico and the mainland.`,
    pick: (m) => {
      const us = destinations.filter(isUS);
      const warm = us.filter((d) => d.months[m].high >= 21 && d.months[m].score >= 50);
      return atLeast(
        warm.sort((a, b) => b.months[m].score - a.months[m].score || b.months[m].high - a.months[m].high),
        [...us].sort((a, b) => b.months[m].high - a.months[m].high),
      );
    },
    metric: 'high',
  },
  {
    key: 'europe-warm',
    label: 'Warmest in Europe',
    path: (m) => `/warmest-places-in-europe-in-${MONTH_SLUGS[m]}/`,
    title: (mn, y) => `Warmest Places in Europe in ${mn} ${y}`,
    h1: (mn) => `Warmest places in Europe in ${mn}`,
    lead: (mn, items, m) =>
      `In ${mn}, the warmest places in Europe are ${names(items)}, with average highs around ${Math.round(
        items[0].months[m].high,
      )}°C. Here's every European destination we cover, ranked by daytime temperature.`,
    pick: (m) =>
      destinations
        .filter((d) => d.region === 'Europe')
        .sort((a, b) => b.months[m].high - a.months[m].high || b.months[m].score - a.months[m].score)
        .slice(0, 15),
    metric: 'high',
  },
  {
    key: 'beach',
    label: 'Beach holidays',
    path: (m) => `/beach-vacations-in-${MONTH_SLUGS[m]}/`,
    title: (mn, y) => `Best Beach Vacations in ${mn} ${y}`,
    h1: (mn) => `Best beach vacations in ${mn}`,
    lead: (mn, items) =>
      `The best beach destinations for ${mn}: ${names(items)} and more — all warm (25°C+ highs) with good or great beach weather.`,
    pick: (m) => {
      const ranked = rankForMonth(m).filter((d) => d.tags.includes('beach'));
      return atLeast(
        ranked.filter((d) => good(d, m) && d.months[m].high >= 25),
        ranked.filter((d) => d.months[m].high >= 25),
      );
    },
    metric: 'score',
  },
  {
    key: 'cheap',
    label: 'Cheap places',
    path: (m) => `/cheap-places-to-travel-in-${MONTH_SLUGS[m]}/`,
    title: (mn, y) => `Cheap Places to Travel in ${mn} ${y} (With Good Weather)`,
    h1: (mn) => `Cheap places to travel in ${mn}`,
    lead: (mn, items) =>
      `Good weather doesn't have to be expensive. These are the best-value destinations with good or great weather in ${mn}, from ${names(
        items,
      )} — sorted by typical daily budget.`,
    pick: (m) =>
      rankForMonth(m)
        .filter((d) => good(d, m))
        .sort((a, b) => a.budget.low - b.budget.low || b.months[m].score - a.months[m].score)
        .slice(0, 20),
    metric: 'budget',
  },
  {
    key: 'us-best',
    label: 'Best in the USA',
    path: (m) => `/best-places-to-travel-in-the-us-in-${MONTH_SLUGS[m]}/`,
    title: (mn, y) => `Best Places to Travel in the US in ${mn} ${y}`,
    h1: (mn) => `Best places to travel in the US in ${mn}`,
    lead: (mn, items) =>
      `Our top US picks for ${mn} are ${names(items)}. Ratings combine average temperature and rainfall, adjusted for hurricane season and park road closures.`,
    pick: (m) => {
      const us = rankForMonth(m, destinations.filter(isUS));
      return atLeast(us.filter((d) => good(d, m)), us);
    },
    metric: 'score',
  },
];

// Region collections: "where to go in Europe in October", "Caribbean in December", "Asia in January".
function regionCollection(key: string, label: string, place: string, slugPart: string, members: (d: Destination) => boolean): Collection {
  return {
    key,
    label,
    path: (m) => `/best-places-to-visit-in-${slugPart}-in-${MONTH_SLUGS[m]}/`,
    title: (mn, y) => `Best Places to Visit in ${place} in ${mn} ${y}`,
    h1: (mn) => `Best places to visit in ${place} in ${mn}`,
    lead: (mn, items, m) =>
      `In ${mn}, the best weather in ${place} is in ${names(items)}. We rated every ${place} destination we cover on temperature and rainfall — ${items.filter((d) => d.months[m].score >= 80).length} rate great this month.`,
    pick: (m) => {
      const ranked = rankForMonth(m, destinations.filter(members));
      return atLeast(ranked.filter((d) => good(d, m)), ranked, 6);
    },
    metric: 'score',
  };
}

COLLECTIONS.push(
  regionCollection('europe', 'Europe', 'Europe', 'europe', (d) => d.region === 'Europe'),
  regionCollection('asia', 'Asia', 'Asia', 'asia', (d) => d.region === 'Asia'),
  regionCollection('caribbean', 'Caribbean', 'the Caribbean', 'the-caribbean', (d) => d.region === 'Caribbean' || ['cancun', 'cartagena', 'key-west'].includes(d.slug)),
);

export const collectionByKey = new Map(COLLECTIONS.map((c) => [c.key, c]));
