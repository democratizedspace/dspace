export const prerender = false;

export async function GET() {
    return new Response(
        JSON.stringify({
            status: 'alive',
            uptimeSeconds: process.uptime(),
            timestamp: new Date().toISOString(),
        }),
        {
            headers: { 'Content-Type': 'application/json' },
        }
    );
}
