import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readPrecacheRoutes(): string[] {
    const swPath = path.resolve(__dirname, '../frontend/public/service-worker.js');
    const swSource = fs.readFileSync(swPath, 'utf8');
    const precacheMatch = swSource.match(/const PRECACHE_URLS = \[(.*?)\];/s);
    if (!precacheMatch) {
        throw new Error('Could not locate PRECACHE_URLS definition in service worker');
    }
    const arrayLiteral = `[${precacheMatch[1]}]`;
    const jsonLiteral = arrayLiteral.replace(/'/g, '"');
    const parsed = JSON.parse(jsonLiteral) as string[];
    return parsed.map((route) => route.trim());
}

function readDocumentedRoutes(): { routes: string[]; line: string } {
    const docPath = path.resolve(__dirname, '../docs/ops/offline-first.md');
    const docSource = fs.readFileSync(docPath, 'utf8');
    const precacheLine = docSource
        .split('\n')
        .find((line) => line.toLowerCase().includes('precache routes'));
    if (!precacheLine) {
        throw new Error('Could not find "Precache routes" line in offline-first runbook');
    }
    const matches = Array.from(precacheLine.matchAll(/`([^`]+)`/g));
    if (matches.length === 0 && precacheLine.toLowerCase().includes('(none')) {
        return { routes: [], line: precacheLine };
    }
    const routes = matches.map(([, route]) => route);
    return { routes, line: precacheLine };
}

describe('offline-first runbook', () => {
    it('documents the same precache routes as the service worker', () => {
        const precacheRoutes = readPrecacheRoutes();
        const { routes: documentedRoutes, line } = readDocumentedRoutes();

        expect(documentedRoutes).toEqual(precacheRoutes);

        const wildcardRoutes = documentedRoutes.filter((route) => route.includes('*'));
        expect(wildcardRoutes, `Unexpected wildcard route in documentation: ${line}`).toHaveLength(0);
    });
});
