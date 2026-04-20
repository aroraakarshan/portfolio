// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

import cloudflare from '@astrojs/cloudflare';

// Update this to the canonical deployed URL before shipping.
const SITE = 'https://akarshanarora.com';

// https://astro.build/config
export default defineConfig({
  site: SITE,

  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],

  adapter: cloudflare(),
});