import { buildRuntimeBuildMetaResponse } from '../utils/runtimeBuildMeta';

export const prerender = false;

export async function GET() {
    return buildRuntimeBuildMetaResponse();
}
