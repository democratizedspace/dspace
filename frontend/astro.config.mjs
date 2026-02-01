import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import svelte from '@astrojs/svelte';
import 'prism-svelte';
import { execSync } from 'node:child_process';

const getGitSha = () => {
    const envSha = process.env.VITE_GIT_SHA || process.env.GIT_SHA || process.env.DSPACE_GIT_SHA;
    if (envSha) {
        return envSha;
    }

    try {
        return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    } catch (error) {
        return 'unknown';
    }
};

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
        define: {
            'import.meta.env.VITE_GIT_SHA': JSON.stringify(getGitSha()),
        },
        server: {
            port: parseInt(process.env.PORT) || 3002, // Use PORT env var or default to 3000
            host: '0.0.0.0',
        },
    },
});
