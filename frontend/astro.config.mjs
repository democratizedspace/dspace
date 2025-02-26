import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';
import svelte from "@astrojs/svelte";

// https://astro.build/config
import vercel from "@astrojs/vercel/serverless";

const adapters = {
  netlify: netlify(),
  vercel: vercel()
};

export default defineConfig({
  output: 'server',
  adapter: adapters[process.env.PLATFORM] || netlify(), // Use Netlify as fallback
  integrations: [svelte()],
  style: {
    postcss: {}
  },
  vite: {
    server: {
      port: parseInt(process.env.PORT) || 3000, // Use PORT env var or default to 3000
      host: "0.0.0.0",
    },
    resolve: {
      alias: {
        "node-domexception": "/domexception-shim.js"
      }
    }
  }
});
