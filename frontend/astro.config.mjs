import { execSync } from 'node:child_process';
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import svelte from '@astrojs/svelte';
import 'prism-svelte';

const resolveBuildGitSha = () => {
    const envSha =
        process.env.VITE_GIT_SHA || process.env.DSPACE_GIT_SHA || process.env.GIT_SHA;
    if (envSha && envSha.trim()) {
        return envSha.trim();
    }

    if (process.env.NODE_ENV !== 'production') {
        return null;
    }

    try {
        return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    } catch (error) {
        return null;
    }
};

const resolvedGitSha = resolveBuildGitSha();
if (resolvedGitSha) {
    process.env.VITE_GIT_SHA = resolvedGitSha;
}

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
