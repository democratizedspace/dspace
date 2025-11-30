import pkg from '../package.json';

export const prerender = false;

const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
};

export async function GET() {
    const uptimeSeconds = Math.round(process.uptime());

    return new Response(
        JSON.stringify({
            status: 'ok',
            uptimeSeconds,
            timestamp: new Date().toISOString(),
            version: pkg.version,
        }),
        {
            headers,
        }
    );
}
