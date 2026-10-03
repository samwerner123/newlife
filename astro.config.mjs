// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/config.ts';

export default defineConfig({
  site: process.env.SITE_URL || SITE.url,
  trailingSlash: 'always',
  // Embeds and the saved-places page are noindex, so they stay out of the sitemap too.
  integrations: [sitemap({ filter: (page) => !page.includes('/embed/') && !page.endsWith('/saved/') })],
});
