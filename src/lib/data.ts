import destinationsJson from '../data/destinations.json';
import climateJson from '../data/climate.json';
import affiliatesJson from '../data/affiliates.json';
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

export const REGIONS = ['Europe', 'Asia', 'Middle East & Africa', 'Americas'] as const;
export type Region = (typeof REGIONS)[number];
export const regionSlug = (r: string) => r.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');

interface RawDestination {
  slug: string;
  name: string;
  country: string;
  region: Region;
  lat: number;
  lon: number;
  iata: string;
  wiki: string;
  climate: ClimateType;
  currency: string;
  budget: { low: number; mid: number };
  tags: string[];
  tagline: string;
  intro: string;
  highlights: string[];
  best: string;
  avoid: string;
  adjust: Record<string, [number, string]>;
  events: Record<string, string>;
  imagePage?: string;
}

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
}

export interface Destination extends RawDestination {
  months: DestinationMonth[];
  climateSource: RawClimate['source'];
  bestMonths: number[];
  url: string;
}

const climate = climateJson as Record<string, RawClimate>;

export const destinations: Destination[] = (destinationsJson as unknown as RawDestination[]).map((d) => {
  const c = climate[d.slug];
  if (!c) throw new Error(`No climate data for ${d.slug} — run npm run climate`);
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

export const monthUrl = (m: number) => `/where-to-go-in-${MONTH_SLUGS[m]}/`;
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
