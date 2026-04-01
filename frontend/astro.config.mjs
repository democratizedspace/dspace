import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import svelte from '@astrojs/svelte';
import 'prism-svelte';

// https://astro.build/config
export default defineConfig({
    output: 'server',
    adapter: node({ mode: 'standalone' }),
    integrations: [svelte()],
    style: {
        postcss: {},
    },
    markdown: {
        syntaxHighlight: 'prism',
        prism: {
            map: { text: 'plaintext' },
        },
    },
    vite: {
        logLevel: 'error',
        server: {
            port: parseInt(process.env.PORT) || 3002, // Use PORT env var or default to 3000
            host: '0.0.0.0',
        },
    },
});
