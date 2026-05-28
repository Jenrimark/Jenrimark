// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'http://47.122.127.145:23333',
  integrations: [mdx()],
  redirects: {
    '/about/': '/intro/',
  },
});