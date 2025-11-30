import type { APIRoute } from 'astro';

export const prerender = false;

const startedAt = Date.now();

export const buildHealthPayload = () => ({
    status: 'ok',
    uptimeSeconds: Number(process.uptime().toFixed(0)),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV || 'production',
    startedAt: new Date(startedAt).toISOString(),
});

export const GET: APIRoute = async () =>
    new Response(JSON.stringify(buildHealthPayload()), {
        status: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
