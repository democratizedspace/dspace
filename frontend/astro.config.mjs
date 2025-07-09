import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import svelte from "@astrojs/svelte";

// https://astro.build/config
const adapters = {
  node: node()
};

export default defineConfig({
  output: 'server',
  adapter: adapters[process.env.PLATFORM] || node(), // Use Node as fallback
  integrations: [svelte()],
  style: {
    postcss: {}
  },
  vite: {
    server: {
      port: parseInt(process.env.PORT) || 3002, // Use PORT env var or default to 3000
      host: "0.0.0.0",
    },
    resolve: {
      alias: {
        "node-domexception": "/domexception-shim.js"
      }
    }
  }
});
