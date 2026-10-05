// Month-based collections that match high-demand searches, e.g.
// "warm places to visit in December", "cheap places to travel in March".
import {
  destinations,
  rankForMonth,
  isUS,
  skiStatus,
  foliageStatus,
  deg,
  usd,
  SKI_LABEL,
  SKI_RATING,
  FOLIAGE_LABEL,
  FOLIAGE_RATING,
  MONTH_SLUGS,
  type Destination,
  type SkiStatus,
  type FoliageStatus,
} from './data';
import type { Rating } from './score';

/** A seasonal activity (skiing, autumn colours) that is rated in place of the weather. */
export interface Season {
  /** Column headings in the "at a glance" table, e.g. "Ski season" and "High / low (town)". */
  heading: string;
  tempHeading: string;
  /** Meta-description tail: "ski areas open in July, with season status…". */
  about: (month: string) => string;
  status: (d: Destination, m: number) => { label: string; rating: Rating; note: string } | undefined;
}

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
  /** Seasonal collections rate the season (snow, autumn colours) rather than the weather. */
  season?: Season;
  /** Months with fewer picks than this get no page (default 1). */
  minItems?: number;
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
    lead: (mn, items, m) => {
      const great = items.filter((d) => d.months[m].score >= 80).length;
      return `In ${mn}, the best weather in ${place} is in ${names(items)}. We rated all ${destinations.filter(members).length} destinations we cover in ${place} on temperature and rainfall — ${
        great ? `${great} rate${great === 1 ? 's' : ''} great this month` : 'none rates great this month, so check the ratings and notes below before you book'
      }.`;
    },
    pick: (m) => {
      const ranked = rankForMonth(m, destinations.filter(members));
      return atLeast(ranked.filter((d) => good(d, m)), ranked, 6);
    },
    metric: 'score',
  };
}

const SOUTH_AMERICA = ['Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Peru', 'Uruguay'];
const AFRICA = ['Botswana', 'Egypt', 'Kenya', 'Mauritius', 'Morocco', 'Namibia', 'Seychelles', 'South Africa', 'Tanzania', 'Zimbabwe'];
// Egypt and Türkiye are usually included in "Middle East" trip lists, so they appear here as well as in Africa/Europe.
const MIDDLE_EAST = ['Egypt', 'Jordan', 'Oman', 'Qatar', 'Türkiye', 'United Arab Emirates'];
const CENTRAL_AMERICA = ['Belize', 'Costa Rica', 'El Salvador', 'Guatemala', 'Honduras', 'Nicaragua', 'Panama'];

COLLECTIONS.push(
  regionCollection('europe', 'Europe', 'Europe', 'europe', (d) => d.region === 'Europe'),
  regionCollection('asia', 'Asia', 'Asia', 'asia', (d) => d.region === 'Asia'),
  regionCollection('caribbean', 'Caribbean', 'the Caribbean', 'the-caribbean', (d) => d.region === 'Caribbean' || ['cancun', 'cartagena', 'key-west'].includes(d.slug)),
  regionCollection('south-america', 'South America', 'South America', 'south-america', (d) => SOUTH_AMERICA.includes(d.country)),
  regionCollection('africa', 'Africa', 'Africa', 'africa', (d) => AFRICA.includes(d.country)),
  regionCollection('middle-east', 'Middle East', 'the Middle East', 'the-middle-east', (d) => MIDDLE_EAST.includes(d.country)),
  regionCollection('central-america', 'Central America', 'Central America', 'central-america', (d) => CENTRAL_AMERICA.includes(d.country)),
  regionCollection('oceania', 'Oceania', 'Oceania', 'oceania', (d) => d.region === 'Oceania'),
);

// Classic romantic trips: overwater-villa islands, beach resorts, and famously romantic cities and wine regions.
export const ROMANTIC = [
  'paris', 'venice', 'florence', 'rome', 'amalfi-coast', 'lake-como', 'cinque-terre', 'santorini', 'mykonos', 'provence',
  'french-riviera', 'kyoto', 'napa-valley', 'prague', 'vienna', 'cape-town', 'queenstown', 'iceland', 'bora-bora', 'tahiti',
  'maldives', 'seychelles', 'mauritius', 'st-lucia', 'turks-and-caicos', 'barbados', 'maui', 'kauai', 'bali', 'fiji',
  'cook-islands', 'zanzibar', 'tulum', 'dubrovnik', 'lake-bled', 'sedona', 'charleston', 'savannah', 'quebec-city', 'bruges',
  'marrakech', 'madeira', 'sicily', 'luang-prabang', 'rajasthan', 'serengeti', 'okavango', 'hoi-an', 'puglia', 'sardinia',
  'big-sur', 'lake-garda', 'loire-valley', 'hallstatt', 'antigua',
];

COLLECTIONS.push({
  key: 'romantic',
  label: 'Romantic getaways',
  path: (m) => `/romantic-getaways-in-${MONTH_SLUGS[m]}/`,
  title: (mn, y) => `Romantic Getaways in ${mn} ${y}: Best Places for Couples`,
  h1: (mn) => `Romantic getaways in ${mn}`,
  lead: (mn, items, m) =>
    `The most romantic places with good weather in ${mn} are ${names(items)}. We ranked ${ROMANTIC.length} classic couples' destinations — island hideaways, beach resorts, wine country and storybook cities — on ${mn}'s temperature and rainfall; ${items.filter((d) => d.months[m].score >= 80).length} rate great.`,
  pick: (m) => {
    const ranked = rankForMonth(m, destinations.filter((d) => ROMANTIC.includes(d.slug)));
    return atLeast(ranked.filter((d) => good(d, m)), ranked, 6).slice(0, 20);
  },
  metric: 'score',
  faq: (mn, items, m) => {
    const beach = items.filter((d) => d.tags.includes('beach') && d.months[m].high >= 25);
    const city = items.filter((d) => d.tags.includes('city'));
    const cheapest = [...items].sort((a, b) => a.budget.low - b.budget.low)[0];
    return [
      { q: `Where is the most romantic place to go in ${mn}?`, a: `${items[0].name} tops our list for ${mn}, averaging ${deg(items[0].months[m].high)} with about ${items[0].months[m].rain} mm of rain. ${items[1] ? `${items[1].name} and ${items[2]?.name ?? ''} are close behind.` : ''}`.trim() },
      beach.length
        ? { q: `Where can couples find warm beaches in ${mn}?`, a: `For beach weather in ${mn}, look at ${names(beach, 4)} — all with highs of 25°C or more and good or great weather scores.` }
        : { q: `Is ${mn} good for a beach honeymoon?`, a: `Few of the classic romantic beach destinations have reliable weather in ${mn}. Our list leans towards cities and wine regions this month; see the honeymoon guide for alternatives.` },
      ...(city.length ? [{ q: `What is the best city for a romantic break in ${mn}?`, a: `${names(city, 3)} are the best-rated romantic cities for ${mn} on our list.` }] : []),
      { q: `What is an affordable romantic getaway in ${mn}?`, a: `${cheapest.name} is the best value here, from about ${usd(cheapest.budget.low)} per person per day excluding flights.` },
    ];
  },
});

// US & Canadian national parks, ranked on the month's weather (with road and facility closures factored into the score).
export const NATIONAL_PARKS = [
  'yellowstone', 'yosemite', 'grand-canyon', 'zion', 'arches-bryce', 'grand-teton', 'glacier-national-park', 'great-smoky-mountains',
  'acadia', 'olympic-national-park', 'joshua-tree', 'banff', 'death-valley', 'mount-rainier', 'denali', 'jasper',
];

COLLECTIONS.push({
  key: 'national-parks',
  label: 'National parks',
  path: (m) => `/best-national-parks-to-visit-in-${MONTH_SLUGS[m]}/`,
  title: (mn, y) => `Best National Parks to Visit in ${mn} ${y}`,
  h1: (mn) => `Best national parks to visit in ${mn}`,
  lead: (mn, items) =>
    `Our top national parks for ${mn} are ${names(items)}. We rated ${NATIONAL_PARKS.length} of the most visited parks in the US and Canada on ${mn}'s temperature and rainfall, and marked down months when roads, lodges or visitor centres close for the season.`,
  pick: (m) => {
    const ranked = rankForMonth(m, destinations.filter((d) => NATIONAL_PARKS.includes(d.slug)));
    return atLeast(ranked.filter((d) => good(d, m)), ranked, 6);
  },
  metric: 'score',
  faq: (mn, items, m) => {
    const notes = items.filter((d) => d.months[m].note && d.months[m].score < 65);
    const warmest = [...items].sort((a, b) => b.months[m].high - a.months[m].high)[0];
    return [
      { q: `Which national park is best to visit in ${mn}?`, a: `${items[0].name} rates best in ${mn}, with average highs of ${deg(items[0].months[m].high)} and about ${items[0].months[m].rain} mm of rain. ${items[1].name} and ${items[2].name} follow.` },
      { q: `Which national park is warmest in ${mn}?`, a: `${warmest.name}, where daytime highs average ${deg(warmest.months[m].high)} in ${mn}.` },
      notes.length
        ? { q: `Which parks should you avoid in ${mn}?`, a: notes.slice(0, 3).map((d) => `${d.name}: ${d.months[m].note}`).join('. ') + '.' }
        : { q: `Are the national parks open in ${mn}?`, a: `All of the parks on this list are open in ${mn}, and none has a major seasonal closure flagged for the month. Check the park's website for trail and road conditions before you go.` },
    ];
  },
});

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
  season: {
    heading: 'Ski season',
    tempHeading: 'High / low (town)',
    about: (mn) => `ski areas open in ${mn}, with season status, resort temperatures and daily budgets.`,
    status: (d, m) => {
      const s = skiStatus(d, m);
      return s && { label: SKI_LABEL[s], rating: SKI_RATING[s], note: `Ski areas: ${d.ski!.resorts}.` };
    },
  },
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

// "Where to see fall foliage in October": ranked by the state of the autumn colours, then by the weather.
const FOLIAGE_ORDER: FoliageStatus[] = ['peak', 'early', 'late'];
const leafPeepers = (m: number) =>
  destinations
    .filter((d) => foliageStatus(d, m))
    .sort(
      (a, b) =>
        FOLIAGE_ORDER.indexOf(foliageStatus(a, m)!) - FOLIAGE_ORDER.indexOf(foliageStatus(b, m)!) ||
        b.months[m].score - a.months[m].score ||
        a.name.localeCompare(b.name),
    );

COLLECTIONS.push({
  key: 'foliage',
  label: 'Fall foliage',
  minItems: 3,
  season: {
    heading: 'Autumn colours',
    tempHeading: 'High / low',
    about: (mn) => `where autumn colours peak in ${mn}, with typical temperatures and daily budgets.`,
    status: (d, m) => {
      const s = foliageStatus(d, m);
      return s && { label: FOLIAGE_LABEL[s], rating: FOLIAGE_RATING[s], note: `Where to look: ${d.foliage!.where}.` };
    },
  },
  path: (m) => `/where-to-see-fall-foliage-in-${MONTH_SLUGS[m]}/`,
  title: (mn, y) => `Where to See Fall Foliage in ${mn} ${y}: Peak Autumn Colours`,
  h1: (mn) => `Where to see fall foliage in ${mn}`,
  lead: (mn, items, m) => {
    const peak = items.filter((d) => foliageStatus(d, m) === 'peak');
    const south = m >= 2 && m <= 5;
    return `${peak.length ? `Autumn colours usually peak in ${list(peak.slice(0, 5))}${peak.length > 5 ? ' and more' : ''} in ${mn}.` : `${mn} brings the last of the autumn colours.`} ${
      south
        ? `This is autumn in the southern hemisphere, when beech forests, poplars and vineyards turn gold and red.`
        : `Leaves turn first in the north and at altitude, then move south and downhill over a few weeks.`
    } Timing shifts by a week or two each year, so check local foliage reports before you go.`;
  },
  pick: leafPeepers,
  metric: 'score',
  faq: (mn, items, m) => {
    const by = (s: FoliageStatus) => items.filter((d) => foliageStatus(d, m) === s);
    const peak = by('peak');
    const warmest = [...items].sort((a, b) => b.months[m].high - a.months[m].high)[0];
    const coldest = [...items].sort((a, b) => a.months[m].high - b.months[m].high)[0];
    return [
      { q: `Where are autumn colours at their peak in ${mn}?`, a: peak.length ? `${mn} is the usual peak in ${list(peak)}.` : `No major region is usually at its peak in ${mn}; the colours are just starting or fading in ${list(items)}.` },
      ...(by('early').length ? [{ q: `Where are the leaves just starting to turn in ${mn}?`, a: `Colours usually start turning in ${list(by('early'))} in ${mn}, with the peak a few weeks later.` }] : []),
      ...(by('late').length ? [{ q: `Where can you catch late colours in ${mn}?`, a: `${list(by('late'))} often still have colour in ${mn}, especially in valleys and lower areas.` }] : []),
      { q: `What is the weather like for leaf-peeping in ${mn}?`, a: `Average highs range from ${deg(coldest.months[m].high)} in ${coldest.name} to ${deg(warmest.months[m].high)} in ${warmest.name}. Mornings can be close to freezing in the mountains, so pack layers.` },
    ];
  },
});

/** Whether a collection has a page for a month (enough picks to be worth one). */
export const hasPage = (c: Collection, m: number) => c.pick(m).length >= (c.minItems ?? 1);

export const collectionByKey = new Map(COLLECTIONS.map((c) => [c.key, c]));
