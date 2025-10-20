export const prerender = false;

export async function GET() {
    const featureFlags = (process.env.DSPACE_FEATURE_FLAGS || '')
        .split(',')
        .map((flag) => flag.trim())
        .filter(Boolean);

    return new Response(
        JSON.stringify({
            status: 'ready',
            timestamp: new Date().toISOString(),
            features: featureFlags,
        }),
        {
            headers: { 'Content-Type': 'application/json' },
        }
    );
}
