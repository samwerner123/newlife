import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import credits from '../data/images.json';

const files = import.meta.glob<ImageMetadata>('../assets/destinations/*.jpg', { eager: true, import: 'default' });

export interface PhotoCredit {
  file: string;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
}

export function photo(slug: string): { src: ImageMetadata; credit: PhotoCredit } | null {
  const src = files[`../assets/destinations/${slug}.jpg`];
  const credit = (credits as Record<string, PhotoCredit>)[slug];
  return src && credit ? { src, credit } : null;
}

/** 1200px JPEG for og:image (social networks don't all accept WebP). */
export async function ogImage(slug: string): Promise<string | undefined> {
  const p = photo(slug);
  if (!p) return undefined;
  const img = await getImage({ src: p.src, width: 1200, format: 'jpeg', quality: 75 });
  return img.src;
}
