// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://yourdomain.com',
  integrations: [mdx()],
});