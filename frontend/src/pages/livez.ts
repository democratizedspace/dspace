export const prerender = false;

export async function GET() {
    return new Response('ok', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
}
