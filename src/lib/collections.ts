// Month-based collections that match high-demand searches, e.g.
// "warm places to visit in December", "cheap places to travel in March".
import { destinations, rankForMonth, isUS, skiStatus, deg, usd, SKI_LABEL, MONTH_SLUGS, type Destination, type SkiStatus } from './data';

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
  /** Ski collections rate the snow season rather than the weather. */
  kind?: 'weather' | 'ski';
  /** Collection-specific FAQ (replaces the generic weather questions). */
  faq?: (month: string, items: Destination[], m: number) => { q: string; a: string }[];
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

const SOUTH_AMERICA = ['Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Peru', 'Uruguay'];
const AFRICA = ['Botswana', 'Egypt', 'Kenya', 'Mauritius', 'Morocco', 'Namibia', 'Seychelles', 'South Africa', 'Tanzania', 'Zimbabwe'];

COLLECTIONS.push(
  regionCollection('europe', 'Europe', 'Europe', 'europe', (d) => d.region === 'Europe'),
  regionCollection('asia', 'Asia', 'Asia', 'asia', (d) => d.region === 'Asia'),
  regionCollection('caribbean', 'Caribbean', 'the Caribbean', 'the-caribbean', (d) => d.region === 'Caribbean' || ['cancun', 'cartagena', 'key-west'].includes(d.slug)),
  regionCollection('south-america', 'South America', 'South America', 'south-america', (d) => SOUTH_AMERICA.includes(d.country)),
  regionCollection('africa', 'Africa', 'Africa', 'africa', (d) => AFRICA.includes(d.country)),
);

// "Where to ski in July": ranked by the state of the ski season, not by sightseeing weather.
const SKI_ORDER: SkiStatus[] = ['peak', 'season', 'early', 'late', 'glacier'];
const skiers = (m: number) =>
  destinations
    .filter((d) => skiStatus(d, m))
    .sort(
      (a, b) =>
        SKI_ORDER.indexOf(skiStatus(a, m)!) - SKI_ORDER.indexOf(skiStatus(b, m)!) ||
        a.months[m].high - b.months[m].high ||
        a.name.localeCompare(b.name),
    );
const list = (ds: Destination[]) => ds.map((d) => d.name).join(', ');

COLLECTIONS.push({
  key: 'ski',
  label: 'Skiing',
  kind: 'ski',
  path: (m) => `/where-to-ski-in-${MONTH_SLUGS[m]}/`,
  title: (mn, y) => `Where to Ski in ${mn} ${y}: Ski Resorts Open in ${mn}`,
  h1: (mn) => `Where to ski in ${mn}`,
  lead: (mn, items, m) => {
    const peak = items.filter((d) => skiStatus(d, m) === 'peak');
    const glacier = items.filter((d) => skiStatus(d, m) === 'glacier');
    if (peak.length)
      return `${mn} is peak ski season in ${list(peak.slice(0, 5))}${peak.length > 5 ? ' and more' : ''}. We list the ski destinations open in ${mn}, with typical temperatures in the resort towns and daily budgets.`;
    if (items.some((d) => skiStatus(d, m) === 'season'))
      return `In ${mn} you can ski in ${list(items.slice(0, 4))}. Here's where the season is running, with typical temperatures and daily budgets.`;
    return `${mn} is between the main ski seasons, but you can still ski in ${list(items.slice(0, 4))}${glacier.length ? ` — including summer glacier skiing in ${list(glacier)}` : ''}. Opening and closing dates vary with snowfall, so check resort websites before you book.`;
  },
  pick: skiers,
  metric: 'score',
  faq: (mn, items, m) => {
    const by = (s: SkiStatus) => items.filter((d) => skiStatus(d, m) === s);
    const peak = by('peak');
    const cheapest = [...items].sort((a, b) => a.budget.low - b.budget.low)[0];
    const coldest = [...items].sort((a, b) => a.months[m].high - b.months[m].high)[0];
    return [
      { q: `Where can you ski in ${mn}?`, a: `Ski destinations open in ${mn}: ${items.map((d) => `${d.name} (${SKI_LABEL[skiStatus(d, m)!].toLowerCase()})`).join(', ')}.` },
      {
        q: `Where is the best skiing in ${mn}?`,
        a: peak.length
          ? `${mn} is peak season in ${list(peak)} — the most reliable snow and the most terrain open.`
          : `No major ski region is at its peak in ${mn}. The best bets are ${list(items.slice(0, 3))}; check snow reports and lift openings before you go.`,
      },
      { q: `What is the cheapest place to ski in ${mn}?`, a: `Of these, ${cheapest.name} has the lowest typical daily budget, from about ${usd(cheapest.budget.low)} per person excluding flights and lift passes.` },
      { q: `How cold is it in ${mn}?`, a: `In the resort towns, average highs range from ${deg(coldest.months[m].high)} in ${coldest.name} upwards. It's colder on the slopes, which are usually 1,000 m or more above town.` },
      ...(by('glacier').length
        ? [{ q: `Can you ski in summer?`, a: `Yes — on glaciers. In ${mn}, ${list(by('glacier'))} offer glacier skiing on a small number of high-altitude runs, usually in the mornings. The big summer alternative is the southern hemisphere: Queenstown, Chile and Argentina ski from about late June to September.` }]
        : []),
    ];
  },
});

export const collectionByKey = new Map(COLLECTIONS.map((c) => [c.key, c]));
