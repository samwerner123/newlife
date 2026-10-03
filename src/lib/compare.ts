// "X vs Y" comparisons. Pairs come from src/data/comparisons.json, which lists only
// pairs that people actually search for (checked against search autocomplete).
import pairsJson from '../data/comparisons.json';
import { bySlug, hubByName, monthRanges, type Destination, type Hub } from './data';
import { rating, type Rating } from './score';

export interface EntityMonth {
  score: number;
  rating: Rating;
  high: number;
  low: number;
  rain: number;
}

export interface Entity {
  id: string;
  kind: 'dest' | 'hub';
  name: string;
  slug: string;
  url: string;
  photo: string;
  region: string;
  months: EntityMonth[];
  bestMonths: number[];
  budget: { low: number; mid: number };
  tags: string[];
  dest?: Destination;
  hub?: Hub;
}

function fromDest(d: Destination): Entity {
  return {
    id: d.slug,
    kind: 'dest',
    name: d.name,
    slug: d.slug,
    url: d.url,
    photo: d.slug,
    region: d.region,
    months: d.months.map((m) => ({ score: m.score, rating: m.rating, high: m.high, low: m.low, rain: m.rain })),
    bestMonths: d.bestMonths,
    budget: d.budget,
    tags: d.tags,
    dest: d,
  };
}

function fromHub(h: Hub): Entity {
  const lows = h.members.map((d) => d.budget.low).sort((a, b) => a - b);
  const mids = h.members.map((d) => d.budget.mid).sort((a, b) => a - b);
  return {
    id: `hub:${h.name}`,
    kind: 'hub',
    name: h.name,
    slug: h.slug,
    url: h.url,
    photo: h.members[0].slug,
    region: h.members[0].region,
    months: h.months.map((m) => ({ score: m.score, rating: rating(m.score), high: m.high, low: m.low, rain: m.rain })),
    bestMonths: h.bestMonths,
    budget: { low: lows[0], mid: mids[Math.floor(mids.length / 2)] },
    tags: [...new Set(h.members.flatMap((d) => d.tags))],
    hub: h,
  };
}

export function entity(id: string): Entity | undefined {
  if (id.startsWith('hub:')) {
    const h = hubByName.get(id.slice(4));
    return h ? fromHub(h) : undefined;
  }
  const d = bySlug.get(id);
  return d ? fromDest(d) : undefined;
}

export interface Comparison {
  a: Entity;
  b: Entity;
  slug: string;
  url: string;
}

export const comparisons: Comparison[] = (pairsJson as [string, string, number][])
  .map(([x, y]) => {
    const a = entity(x);
    const b = entity(y);
    if (!a || !b) return null;
    const slug = `${a.slug}-vs-${b.slug}`;
    return { a, b, slug, url: `/compare/${slug}/` };
  })
  .filter((c): c is Comparison => c !== null);

export const comparisonsFor = (id: string) => comparisons.filter((c) => c.a.id === id || c.b.id === id);

const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

export function verdict(a: Entity, b: Entity) {
  const hiA = avg(a.months.map((m) => m.high));
  const hiB = avg(b.months.map((m) => m.high));
  const rainA = a.months.reduce((s, m) => s + m.rain, 0);
  const rainB = b.months.reduce((s, m) => s + m.rain, 0);
  const greatA = a.months.filter((m) => m.rating === 'great').length;
  const greatB = b.months.filter((m) => m.rating === 'great').length;
  const winsA = a.months.filter((m, i) => m.score > b.months[i].score).map((_, i) => i);
  const monthsA = a.months.map((m, i) => i).filter((i) => a.months[i].score > b.months[i].score);
  const monthsB = a.months.map((m, i) => i).filter((i) => b.months[i].score > a.months[i].score);
  const reasons = (x: Entity, y: Entity, hx: number, hy: number, rx: number, ry: number, gx: number, gy: number, mx: number[]) => {
    const out: string[] = [];
    if (mx.length) out.push(`you're travelling in ${monthRanges(mx)}, when it has the better weather`);
    if (hx - hy >= 1.5) out.push(`you want more heat — it averages ${Math.round(hx - hy)}°C warmer`);
    if (hy - hx >= 1.5) out.push(`you prefer milder temperatures — it averages ${Math.round(hy - hx)}°C cooler`);
    if (ry - rx >= 150) out.push(`you want drier weather — about ${Math.round(ry - rx)} mm less rain a year`);
    if (y.budget.low - x.budget.low >= 10) out.push(`budget matters — it's from $${x.budget.low}/day vs $${y.budget.low}/day`);
    if (gx > gy) out.push(`you want flexibility — it has ${gx} months of great weather vs ${gy}`);
    const extraTags = x.tags.filter((t) => !y.tags.includes(t) && ['beach', 'nightlife', 'culture', 'history', 'food', 'nature', 'wildlife', 'islands', 'wine', 'luxury', 'family'].includes(t));
    if (extraTags.length) out.push(`you're into ${extraTags.slice(0, 2).join(' and ')}`);
    return out.slice(0, 4);
  };
  return {
    hiA,
    hiB,
    rainA,
    rainB,
    greatA,
    greatB,
    winsA: winsA.length,
    monthsA,
    monthsB,
    chooseA: reasons(a, b, hiA, hiB, rainA, rainB, greatA, greatB, monthsA),
    chooseB: reasons(b, a, hiB, hiA, rainB, rainA, greatB, greatA, monthsB),
  };
}
