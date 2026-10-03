import destinationsJson from '../data/destinations.json';
import climateJson from '../data/climate.json';
import affiliatesJson from '../data/affiliates.json';
import countriesJson from '../data/countries.json';
import hubsJson from '../data/hubs.json';
import seaJson from '../data/sea.json';
import {
  weatherScore,
  rating,
  tempClass,
  type ClimateType,
  type MonthClimate,
  type Rating,
  type TempClass,
} from './score';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
export const MONTH_SHORT = MONTHS.map((m) => m.slice(0, 3));
export const MONTH_SLUGS = MONTHS.map((m) => m.toLowerCase());

export const REGIONS = [
  'Europe',
  'Asia',
  'Middle East & Africa',
  'North America',
  'Caribbean',
  'Central & South America',
  'Oceania',
] as const;
export type Region = (typeof REGIONS)[number];

/** URL-safe slug: "Türkiye" → "turkiye", "US National Parks" → "us-national-parks". */
export const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
export const regionSlug = slugify;

interface RawDestination {
  slug: string;
  name: string;
  country: string;
  region: Region;
  lat: number;
  lon: number;
  iata: string;
  wiki: string;
  climateWiki?: string | string[];
  /** Country/state/region hub(s); the first one is the destination's home hub (breadcrumbs). */
  hub?: string | string[];
  climate: ClimateType;
  currency: string;
  tz: string;
  stay: [string, string][];
  budget: { low: number; mid: number };
  tags: string[];
  tagline: string;
  intro: string;
  highlights: string[];
  best: string;
  avoid: string;
  adjust: Record<string, [number, string]>;
  events: Record<string, string>;
  imagePage?: string | string[];
  imageFile?: string;
  /** Ski season by month ("1"–"12"), for destinations with major ski areas. */
  ski?: { resorts: string; months: Record<string, SkiStatus> };
  /** Autumn-colour season by month ("1"–"12"), for destinations known for fall foliage. */
  foliage?: { where: string; months: Record<string, FoliageStatus> };
}

export type FoliageStatus = 'early' | 'peak' | 'late';
export const FOLIAGE_LABEL: Record<FoliageStatus, string> = {
  early: 'Colours turning',
  peak: 'Peak colours',
  late: 'Late colours',
};

export type SkiStatus = 'peak' | 'season' | 'early' | 'late' | 'glacier';
export const SKI_LABEL: Record<SkiStatus, string> = {
  peak: 'Peak ski season',
  season: 'Ski season',
  early: 'Season opening',
  late: 'Late season',
  glacier: 'Glacier skiing',
};
export const SKI_RATING: Record<SkiStatus, Rating> = { peak: 'great', season: 'good', early: 'fair', late: 'fair', glacier: 'fair' };
export const FOLIAGE_RATING: Record<FoliageStatus, Rating> = { peak: 'great', early: 'good', late: 'fair' };

interface RawClimate {
  months: MonthClimate[];
  source: { page: string; location: string; rain: string; rainDaysUnit: string };
}

export interface DestinationMonth extends MonthClimate {
  index: number;
  name: string;
  short: string;
  slug: string;
  score: number;
  rating: Rating;
  temp: TempClass;
  note: string | null;
  event: string | null;
  /** Average hours of daylight (sunrise to sunset), computed from the latitude. */
  daylight: number;
  /** Average sea-surface temperature (°C) for coastal destinations, else null. */
  sea: number | null;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Hours from sunrise to sunset (including refraction) at a latitude on a day of the year (1–365). */
export function dayLength(lat: number, day: number): number {
  const rad = Math.PI / 180;
  const decl = 23.44 * Math.sin(rad * (360 / 365) * (day - 81));
  const cosH = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(decl * rad)) / (Math.cos(lat * rad) * Math.cos(decl * rad));
  if (cosH <= -1) return 24;
  if (cosH >= 1) return 0;
  return (2 * Math.acos(cosH)) / rad / 15;
}

/** Average daylight for a month, to one decimal place. */
export function monthDaylight(lat: number, m: number): number {
  const first = DAYS_IN_MONTH.slice(0, m).reduce((a, b) => a + b, 0) + 1;
  let total = 0;
  for (let d = 0; d < DAYS_IN_MONTH[m]; d++) total += dayLength(lat, first + d);
  return Math.round((total / DAYS_IN_MONTH[m]) * 10) / 10;
}

const sea = seaJson as Record<string, { months: number[] } | null>;

export interface Destination extends RawDestination {
  months: DestinationMonth[];
  climateSource: RawClimate['source'];
  bestMonths: number[];
  url: string;
}

const climate = climateJson as Record<string, RawClimate>;

const raw = destinationsJson as unknown as RawDestination[];
const missingClimate = raw.filter((d) => !climate[d.slug]).map((d) => d.slug);
if (missingClimate.length) console.warn(`[data] skipping destinations without climate data (run npm run climate): ${missingClimate.join(', ')}`);

export const destinations: Destination[] = raw.filter((d) => climate[d.slug]).map((d) => {
  const c = climate[d.slug];
  const months = c.months.map((m, i): DestinationMonth => {
    const adj = d.adjust[String(i + 1)];
    const score = weatherScore(d.climate, m, adj ? adj[0] : 0);
    return {
      ...m,
      index: i,
      name: MONTHS[i],
      short: MONTH_SHORT[i],
      slug: MONTH_SLUGS[i],
      score,
      rating: rating(score),
      temp: tempClass(m.high),
      note: adj ? adj[1] : null,
      event: d.events[String(i + 1)] ?? null,
      daylight: monthDaylight(d.lat, i),
      sea: sea[d.slug]?.months[i] ?? null,
    };
  });
  const great = months.filter((m) => m.rating === 'great').map((m) => m.index);
  const bestMonths = great.length ? great : months.filter((m) => m.rating === 'good').map((m) => m.index);
  return { ...d, months, climateSource: c.source, bestMonths, url: `/destinations/${d.slug}/` };
});

export const bySlug = new Map(destinations.map((d) => [d.slug, d]));

export function rankForMonth(month: number, list: Destination[] = destinations) {
  // Ties (several destinations can max out at 100) go to the sunnier place, then the cheaper one.
  return [...list].sort(
    (a, b) =>
      b.months[month].score - a.months[month].score ||
      (b.months[month].sunHours ?? 0) - (a.months[month].sunHours ?? 0) ||
      a.budget.low - b.budget.low,
  );
}

/** Turns month indexes into readable ranges, wrapping around the year: [10,11,0,1,5] → "November–February, June". */
export function monthRanges(indexes: number[], names: readonly string[] = MONTHS): string {
  if (!indexes.length) return '';
  if (indexes.length === 12) return 'all year round';
  const set = new Set(indexes);
  // Start each run at a month whose predecessor is not included, so Nov–Feb stays one run.
  const starts = [...set].filter((m) => !set.has((m + 11) % 12)).sort((a, b) => a - b);
  return starts
    .map((start) => {
      let end = start;
      while (set.has((end + 1) % 12) && (end + 1) % 12 !== start) end = (end + 1) % 12;
      return end === start ? names[start] : `${names[start]}–${names[end]}`;
    })
    .join(', ');
}

/** "Lisbon is best in April–June" / "Maui is great all year round". */
export const bestIn = (name: string, months: number[]) =>
  months.length === 12 ? `${name} is great all year round` : months.length ? `${name} is best in ${monthRanges(months)}` : `${name} has no standout month`;

export const monthUrl = (m: number) => `/where-to-go-in-${MONTH_SLUGS[m]}/`;

/** The next time a month comes round, as seen from the build date — used in titles like "October 2026". */
export function travelYear(m: number, now = new Date()): number {
  return m >= now.getMonth() ? now.getFullYear() : now.getFullYear() + 1;
}

export const skiStatus = (d: Destination, m: number): SkiStatus | undefined => d.ski?.months[String(m + 1)];
export const foliageStatus = (d: Destination, m: number): FoliageStatus | undefined => d.foliage?.months[String(m + 1)];

export const isUS = (d: Destination) => d.country === 'United States' || d.country === 'Puerto Rico';

// ---- Country facts ---------------------------------------------------------

export interface CountryInfo {
  language: string;
  plugs: string;
  tipping: string;
}
const countries = countriesJson as Record<string, CountryInfo>;
export const countryInfo = (d: Destination): CountryInfo | undefined => countries[d.country];

// ---- Hubs: countries / states / groups with several destinations ------------

export interface HubMonth {
  index: number;
  name: string;
  score: number;
  rating: Rating;
  high: number;
  low: number;
  rain: number;
  best: Destination;
  worst: Destination;
}

export interface Hub {
  name: string;
  /** Name as used mid-sentence ("the Caribbean"), and capitalised for the start of a title ("The Caribbean"). */
  label: string;
  Label: string;
  /** Destination whose photo represents the hub. */
  photo: string;
  slug: string;
  url: string;
  members: Destination[];
  months: HubMonth[];
  bestMonths: number[];
  country?: string;
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** All hubs a destination belongs to, home hub first. */
export const hubNames = (d: Pick<Destination, 'hub'>): string[] => (d.hub ? ([] as string[]).concat(d.hub) : []);

export const hubs: Hub[] = [...new Set(destinations.flatMap(hubNames))]
  .map((name) => {
    const members = destinations.filter((d) => hubNames(d).includes(name));
    const months = MONTHS.map((mn, i): HubMonth => {
      const ranked = rankForMonth(i, members);
      const score = Math.round(avg(members.map((d) => d.months[i].score)));
      return {
        index: i,
        name: mn,
        score,
        rating: rating(score),
        high: avg(members.map((d) => d.months[i].high)),
        low: avg(members.map((d) => d.months[i].low)),
        rain: Math.round(avg(members.map((d) => d.months[i].rain))),
        best: ranked[0],
        worst: ranked[ranked.length - 1],
      };
    });
    const great = months.filter((m) => m.rating === 'great').map((m) => m.index);
    const bestMonths = great.length ? great : months.filter((m) => m.rating === 'good').map((m) => m.index);
    const countriesInHub = new Set(members.map((d) => d.country.replace(/\s*\(.*\)$/, '')));
    const text = (hubsJson as Record<string, { label?: string; photo?: string }>)[name];
    const label = text?.label ?? name;
    return {
      name,
      label,
      Label: label[0].toUpperCase() + label.slice(1),
      photo: text?.photo && members.some((d) => d.slug === text.photo) ? text.photo : members[0].slug,
      slug: slugify(name),
      url: `/best-time-to-visit-${slugify(name)}/`,
      members,
      months,
      bestMonths,
      country: countriesInHub.size === 1 && [...countriesInHub][0] === name ? name : undefined,
    };
  })
  .filter((h) => h.members.length >= 2)
  .sort((a, b) => a.name.localeCompare(b.name));

export const hubByName = new Map(hubs.map((h) => [h.name, h]));
export const hubOf = (d: Destination) => hubNames(d).map((n) => hubByName.get(n)).find((h) => h !== undefined);
export const hubsOf = (d: Destination) => hubNames(d).map((n) => hubByName.get(n)).filter((h) => h !== undefined);
export const hubMonthUrl = (h: Hub, m: number) => `/${h.slug}-in-${MONTH_SLUGS[m]}/`;
export const destMonthUrl = (d: Destination, m: number) => `/destinations/${d.slug}/${MONTH_SLUGS[m]}/`;

// ---- Affiliate links -------------------------------------------------------

export type PartnerKind = 'flights' | 'hotels' | 'tours' | 'transfers' | 'insurance' | 'esim';

interface Partner {
  label: string;
  brand: string;
  cta: string;
  url: string;
}

const affiliates = affiliatesJson as {
  partners: Record<PartnerKind, Partner>;
  overrides: Record<string, Partial<Record<PartnerKind, string>>>;
};

export interface PartnerLink extends Partner {
  kind: PartnerKind;
}

/** Partner links for a destination (or site-wide when slug is omitted). Empty urls are dropped. */
export function partnerLinks(slug?: string, kinds?: PartnerKind[]): PartnerLink[] {
  const order = kinds ?? (Object.keys(affiliates.partners) as PartnerKind[]);
  return order
    .map((kind) => {
      const p = affiliates.partners[kind];
      const url = (slug && affiliates.overrides[slug]?.[kind]) || p.url;
      return { ...p, kind, url };
    })
    .filter((p) => p.url);
}

// ---- Small text helpers ----------------------------------------------------

export const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
export const deg = (n: number) => `${Math.round(n)}°C`;
export const plural = (n: number, word: string) => `${Math.round(n)} ${word}${Math.round(n) === 1 ? '' : 's'}`;

export function packingTips(d: Destination, m: DestinationMonth): string[] {
  const tips: string[] = [];
  if (m.high >= 30) tips.push('Light, breathable clothes, a sun hat and high-SPF sunscreen');
  else if (m.high >= 24) tips.push('Summer clothes and swimwear, plus a light layer for air-conditioning');
  else if (m.high >= 17) tips.push('T-shirts plus a light jacket or sweater for the evenings');
  else if (m.high >= 10) tips.push('Warm layers, a proper jacket and comfortable closed shoes');
  else tips.push('A winter coat, hat, gloves and thermal layers');
  if (m.low <= 8 && m.high >= 17) tips.push(`Something warm for nights that drop to around ${deg(m.low)}`);
  if (m.rain >= 100 || (m.rainDays ?? 0) >= 10) tips.push('A compact umbrella or a packable rain jacket');
  if (m.high >= 27 && d.tags.includes('beach')) tips.push('Reef-safe sunscreen and a rash guard for long beach days');
  if (d.climate === 'highland') tips.push('Comfortable walking shoes — this is a high-altitude destination');
  tips.push('A refillable water bottle and a universal travel adapter');
  return tips;
}
