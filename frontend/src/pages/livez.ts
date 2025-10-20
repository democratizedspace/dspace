export const prerender = false;

export function GET() {
    return new Response('ok', {
        headers: { 'Cache-Control': 'no-store' },
    });
}
