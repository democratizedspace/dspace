import { buildLivezResponse } from '../utils/runtimeEndpoints';

export const prerender = false;

export async function GET() {
    return buildLivezResponse();
}
