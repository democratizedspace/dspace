import { buildRuntimeBuildMetaResponse } from '../utils/buildMetaServer';

export const prerender = false;

export async function GET() {
    return buildRuntimeBuildMetaResponse();
}
