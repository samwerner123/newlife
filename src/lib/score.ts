// Month-by-month "weather score" (0–100) for each destination.
// Inputs are climate normals (average daily high/low and monthly rainfall).
// The formula is documented for readers on /about/ — keep the two in sync.

export type ClimateType = 'temperate' | 'tropical' | 'highland';

export interface MonthClimate {
  high: number;
  low: number;
  rain: number;
  rainDays: number | null;
  sunHours: number | null;
}

export type Rating = 'great' | 'good' | 'fair' | 'poor';

// Comfortable average daily highs for sightseeing / beach time, by climate type.
export const IDEAL_HIGH: Record<ClimateType, [number, number]> = {
  temperate: [21, 29],
  tropical: [26, 31],
  highland: [17, 28],
};

const clamp = (x: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, x));

export function temperatureScore(type: ClimateType, m: Pick<MonthClimate, 'high' | 'low'>): number {
  const [lo, hi] = IDEAL_HIGH[type];
  let t = 100;
  if (m.high < lo) t -= (lo - m.high) * 9;
  if (m.high > hi) t -= (m.high - hi) * (type === 'tropical' ? 10 : 11);
  if (type !== 'highland' && m.low < 3) t -= Math.min(20, (3 - m.low) * 3);
  return clamp(t);
}

export function rainScore(mm: number): number {
  if (mm <= 40) return 100;
  if (mm <= 150) return 100 - (mm - 40) * 0.45;
  if (mm <= 300) return 50.5 - (mm - 150) * 0.2;
  return Math.max(5, 20.5 - (mm - 300) * 0.08);
}

export function weatherScore(type: ClimateType, m: MonthClimate, adjust = 0): number {
  return Math.round(clamp(0.55 * temperatureScore(type, m) + 0.45 * rainScore(m.rain) + adjust));
}

export function rating(score: number): Rating {
  if (score >= 80) return 'great';
  if (score >= 65) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

export const RATING_LABEL: Record<Rating, string> = {
  great: 'Great',
  good: 'Good',
  fair: 'Fair',
  poor: 'Not ideal',
};

export type TempClass = 'hot' | 'warm' | 'mild' | 'cool';

export function tempClass(high: number): TempClass {
  if (high >= 30) return 'hot';
  if (high >= 25) return 'warm';
  if (high >= 18) return 'mild';
  return 'cool';
}

export const TEMP_LABEL: Record<TempClass, string> = {
  hot: 'Hot (30°C+)',
  warm: 'Warm (25–29°C)',
  mild: 'Mild (18–24°C)',
  cool: 'Cool (under 18°C)',
};
