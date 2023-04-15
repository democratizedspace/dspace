import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: netlify(),
  integrations: [svelte()],
  vite: {
    resolve: {
      alias: {
        "node-domexception": "/domexception-shim.js",
      },
    },
  },
});
