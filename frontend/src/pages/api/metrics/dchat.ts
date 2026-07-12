import {
    recordDchatRequest,
    recordDependencyRequest,
    normalizeDependency,
    normalizeOutcome,
    normalizeProvider,
} from '../../../utils/metrics.js';

export const prerender = false;

const boundedDuration = (value: unknown) => {
    const duration = Number(value);
    return Number.isFinite(duration) && duration >= 0 && duration <= 300 ? duration : 0;
};

export async function POST({ request }: { request: Request }) {
    let payload: Record<string, unknown>;
    try {
        payload = await request.json();
    } catch {
        return new Response('invalid metrics payload\n', { status: 400 });
    }

    const outcome = normalizeOutcome(payload.outcome);
    const durationSeconds = boundedDuration(payload.durationSeconds);

    if (payload.kind === 'dchat') {
        recordDchatRequest({
            provider: normalizeProvider(payload.provider),
            outcome,
            durationSeconds,
        });
        return new Response(null, { status: 204 });
    }

    if (payload.kind === 'dependency') {
        recordDependencyRequest({
            dependency: normalizeDependency(payload.dependency),
            outcome,
            durationSeconds,
        });
        return new Response(null, { status: 204 });
    }

    return new Response('unknown metrics kind\n', { status: 400 });
}
