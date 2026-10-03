export interface Guide {
  slug: string;
  title: string;
  description: string;
  kicker: string;
}

export const GUIDES: Guide[] = [
  { slug: 'hurricane-season', title: 'Hurricane Season Guide: Caribbean, Florida & Mexico', description: 'When hurricane season runs, which months carry the most risk, and the safest places to go in the Caribbean, Florida and Mexico.', kicker: 'Seasonal guide' },
  { slug: 'monsoon-season-asia', title: 'Monsoon Season in Asia: Where It Rains and When', description: 'Month-by-month monsoon guide for Thailand, Vietnam, Bali, India, Sri Lanka and more — and where stays dry instead.', kicker: 'Seasonal guide' },
  { slug: 'cherry-blossom-season', title: 'Cherry Blossom Season 2027: When and Where to See It', description: 'When cherry blossoms bloom in Tokyo, Kyoto, Okinawa, Hokkaido, Seoul, Washington, D.C. and beyond, and how to plan around the crowds.', kicker: 'Nature calendar' },
  { slug: 'northern-lights', title: 'Best Time to See the Northern Lights', description: 'When and where to see the aurora borealis — Iceland, Tromsø, Alaska and Canada — plus tips for better odds.', kicker: 'Nature calendar' },
  { slug: 'winter-sun', title: 'Winter Sun: The Warmest Places to Go from December to February', description: 'Where to find reliable sunshine and warmth in winter, from the Caribbean and Canary Islands to Southeast Asia — ranked with real climate data.', kicker: 'Where to go' },
  { slug: 'festival-calendar', title: 'Festival Calendar: The World’s Best Festivals Month by Month', description: 'A month-by-month calendar of famous festivals and seasonal events across our destinations — from Carnival to cherry blossoms.', kicker: 'Events' },
  { slug: 'cheapest-places-to-travel', title: 'The Cheapest Places to Travel (and When to Go)', description: 'Daily travel budgets for every destination we cover, sorted from cheapest — with the best-weather months for each.', kicker: 'Budget' },
];
