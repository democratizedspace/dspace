import type { APIRoute } from 'astro';
import { buildHealthPayload } from './healthz.ts';

export const prerender = false;

export const GET: APIRoute = async () =>
    new Response(JSON.stringify(buildHealthPayload()), {
        status: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
