export type HealthStatus = 'ok';

const jsonHeaders = Object.freeze({ 'Content-Type': 'application/json' });

export function buildHealthResponse(status: HealthStatus = 'ok') {
    return new Response(
        JSON.stringify({
            status,
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.round(process.uptime()),
        }),
        { headers: jsonHeaders }
    );
}
