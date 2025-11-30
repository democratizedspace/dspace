import { buildRuntimeConfigResponse } from '../utils/runtimeEndpoints';

export const prerender = false;

export async function GET() {
    return buildRuntimeConfigResponse();
}
