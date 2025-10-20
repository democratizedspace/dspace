import { buildHealthResponse } from '../utils/health';

export const prerender = false;

export function GET() {
    return buildHealthResponse();
}
