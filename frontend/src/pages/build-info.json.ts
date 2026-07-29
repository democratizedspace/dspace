import { buildRuntimeBuildMetaResponse } from '../utils/buildMetaServer';

export const prerender = false;

export async function GET() {
    return buildRuntimeBuildMetaResponse({ compatibility: false, route: '/build-info.json' });
}
