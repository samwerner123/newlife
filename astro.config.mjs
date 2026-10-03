// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/config.ts';

export default defineConfig({
  site: process.env.SITE_URL || SITE.url,
  trailingSlash: 'always',
  integrations: [sitemap()],
});
