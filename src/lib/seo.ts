import { SITE } from '../config';

export function breadcrumbLd(items: { name: string; href: string }[], site: URL | undefined) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: new URL(it.href, site ?? SITE.url).toString(),
    })),
  };
}
