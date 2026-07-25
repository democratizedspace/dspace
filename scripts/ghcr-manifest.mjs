#!/usr/bin/env node
import { appendFileSync } from 'node:fs';

const REGISTRY_HOST = 'https://ghcr.io';
const DEFAULT_TIMEOUT_MS = 15000;

const MANIFEST_ACCEPT_HEADER = [
    'application/vnd.oci.image.index.v1+json',
    'application/vnd.docker.distribution.manifest.list.v2+json',
    'application/vnd.oci.image.manifest.v1+json',
    'application/vnd.docker.distribution.manifest.v2+json',
].join(', ');
const DIGEST = /^sha256:[0-9a-f]{64}$/;

export class GhcrGuardError extends Error {
    constructor(message, { code = 'unknown' } = {}) {
        super(message);
        this.name = 'GhcrGuardError';
        this.code = code;
    }
}

function requireField(value, label) {
    if (!value || typeof value !== 'string') {
        throw new GhcrGuardError(`Missing required value: ${label}`, { code: 'invalid-input' });
    }
    return value;
}

async function fetchWithTimeout(fetchImpl, url, init, timeoutMs, describeAction) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetchImpl(url, { ...init, signal: controller.signal });
    } catch (error) {
        if (error && error.name === 'AbortError') {
            throw new GhcrGuardError(`Timed out after ${timeoutMs}ms while ${describeAction}`, {
                code: 'timeout',
            });
        }
        // Fetch errors can contain credential-bearing request details. Classify
        // the failure without propagating the underlying error message.
        throw new GhcrGuardError(`Network error while ${describeAction}`, {
            code: 'network',
        });
    } finally {
        clearTimeout(timer);
    }
}

// GHCR follows the standard Docker Registry v2 auth flow: a Basic-auth request against
// /token exchanges the workflow's GITHUB_TOKEN for a short-lived Bearer token scoped to
// read-only access on this one repository.
export async function fetchGhcrToken({
    owner,
    repo,
    username,
    password,
    fetchImpl = fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
    requireField(owner, 'owner');
    requireField(repo, 'repo');
    requireField(username, 'username');
    requireField(password, 'password');

    const scope = `repository:${owner}/${repo}:pull`;
    const url = `${REGISTRY_HOST}/token?service=ghcr.io&scope=${encodeURIComponent(scope)}`;
    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

    const response = await fetchWithTimeout(
        fetchImpl,
        url,
        { headers: { Authorization: `Basic ${basicAuth}` } },
        timeoutMs,
        'requesting a GHCR registry token'
    );

    if (!response.ok) {
        const code = response.status === 401 || response.status === 403 ? 'auth' : 'indeterminate';
        throw new GhcrGuardError(`GHCR token request failed with status ${response.status}`, {
            code,
        });
    }

    let body;
    try {
        body = await response.json();
    } catch (error) {
        throw new GhcrGuardError('GHCR token response was not valid JSON', { code: 'malformed' });
    }

    if (!body || typeof body.token !== 'string' || body.token.length === 0) {
        throw new GhcrGuardError('GHCR token response did not include a token', {
            code: 'malformed',
        });
    }

    return body.token;
}

// Returns { status: 'absent' } only on an authoritative registry 404. Every other outcome
// (found, auth failure, network failure, timeout, unexpected status, malformed body) is
// surfaced to the caller as either status: 'present' or a thrown GhcrGuardError, so callers
// can fail closed rather than assume absence.
export async function getManifest({
    owner,
    repo,
    tag,
    token,
    fetchImpl = fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
    requireField(owner, 'owner');
    requireField(repo, 'repo');
    requireField(tag, 'tag');
    requireField(token, 'token');

    const url = `${REGISTRY_HOST}/v2/${owner}/${repo}/manifests/${encodeURIComponent(tag)}`;
    const response = await fetchWithTimeout(
        fetchImpl,
        url,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: MANIFEST_ACCEPT_HEADER,
            },
        },
        timeoutMs,
        'requesting the GHCR manifest'
    );

    if (response.status === 404) {
        return { status: 'absent' };
    }

    if (response.status === 401 || response.status === 403) {
        throw new GhcrGuardError(`GHCR manifest request was denied with status ${response.status}`, {
            code: 'auth',
        });
    }

    if (!response.ok) {
        throw new GhcrGuardError(
            `GHCR manifest request returned an indeterminate status ${response.status}`,
            { code: 'indeterminate' }
        );
    }

    const digest = response.headers.get('docker-content-digest') || '';
    if (!digest) {
        throw new GhcrGuardError(
            'GHCR manifest response was missing a Docker-Content-Digest header',
            { code: 'malformed' }
        );
    }

    let body;
    try {
        body = await response.json();
    } catch (error) {
        throw new GhcrGuardError('GHCR manifest response body was not valid JSON', {
            code: 'malformed',
        });
    }

    const manifests = Array.isArray(body?.manifests)
        ? body.manifests
              .filter((entry) => entry && entry.platform && typeof entry.digest === 'string')
              .map((entry) => ({
                  architecture: entry.platform.architecture,
                  os: entry.platform.os,
                  digest: entry.digest,
              }))
        : [];

    const result = { status: 'present', digest, manifests };
    Object.defineProperty(result, 'body', { value: body, enumerable: false });
    return result;
}

export async function getBlob({
  owner,
  repo,
  digest,
  token,
  fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  requireField(owner, 'owner');
  requireField(repo, 'repo');
  requireField(token, 'token');
  if (!DIGEST.test(digest)) {
    throw new GhcrGuardError('Invalid OCI blob digest', { code: 'malformed' });
  }
  const url = `${REGISTRY_HOST}/v2/${owner}/${repo}/blobs/${digest}`;
  const response = await fetchWithTimeout(
    fetchImpl,
    url,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
    timeoutMs,
    'requesting a GHCR blob'
  );
  if (response.status === 401 || response.status === 403) {
    throw new GhcrGuardError(
      `GHCR blob request was denied with status ${response.status}`,
      { code: 'auth' }
    );
  }
  if (!response.ok) {
    throw new GhcrGuardError(
      `GHCR blob request returned an indeterminate status ${response.status}`,
      { code: 'indeterminate' }
    );
  }
  try {
    return await response.json();
  } catch {
    throw new GhcrGuardError('GHCR blob response body was not valid JSON', {
      code: 'malformed',
    });
  }
}

export async function inspectImage({
  owner,
  repo,
  tag,
  username,
  password,
  revision,
  fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const token = await fetchGhcrToken({ // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    owner,
    repo,
    username,
    password,
    fetchImpl,
    timeoutMs,
  });
  const index = await getManifest({
    owner,
    repo,
    tag,
    token,
    fetchImpl,
    timeoutMs,
  });
  if (index.status !== 'present')
    throw new GhcrGuardError(
      `Required immutable image ${owner}/${repo}:${tag} is missing`,
      { code: 'missing' }
    );
  if (!DIGEST.test(index.digest))
    throw new GhcrGuardError('Invalid image index digest', {
      code: 'malformed',
    });
  const platforms = {};
  for (const architecture of ['amd64', 'arm64']) {
    const candidates = index.manifests.filter(
      (item) => item.os === 'linux' && item.architecture === architecture
    );
    if (candidates.length !== 1 || !DIGEST.test(candidates[0].digest)) {
      throw new GhcrGuardError(
        `Image requires exactly one linux/${architecture} manifest`,
        { code: 'missing-platform' }
      );
    }
    const manifest = await getManifest({
      owner,
      repo,
      tag: candidates[0].digest,
      token,
      fetchImpl,
      timeoutMs,
    });
    if (manifest.status !== 'present' || manifest.digest !== candidates[0].digest)
      throw new GhcrGuardError(
        `linux/${architecture} manifest digest does not match its index descriptor`,
        { code: 'digest-mismatch' }
      );
    const configDigest =
      manifest.status === 'present' && manifest.body?.config?.digest;
    if (!DIGEST.test(configDigest || ''))
      throw new GhcrGuardError(
        `linux/${architecture} manifest has an invalid config`,
        { code: 'malformed' }
      );
    const config = await getBlob({
      owner,
      repo,
      digest: configDigest,
      token,
      fetchImpl,
      timeoutMs,
    });
    if (
      config?.config?.Labels?.['org.opencontainers.image.revision'] !== revision
    ) {
      throw new GhcrGuardError(
        `linux/${architecture} image revision label does not match approved source`,
        { code: 'revision-mismatch' }
      );
    }
    platforms[architecture] = candidates[0].digest;
  }
  return {
    indexDigest: index.digest,
    amd64Digest: platforms.amd64,
    arm64Digest: platforms.arm64,
  };
}

export async function inspectChart({
  owner,
  repo,
  tag,
  username,
  password,
  version,
  appVersion,
  revision,
  fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const token = await fetchGhcrToken({ // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    owner,
    repo,
    username,
    password,
    fetchImpl,
    timeoutMs,
  });
  const artifact = await getManifest({
    owner,
    repo,
    tag,
    token,
    fetchImpl,
    timeoutMs,
  });
  if (artifact.status !== 'present')
    throw new GhcrGuardError(
      `Required chart ${owner}/${repo}:${tag} is missing`,
      { code: 'missing' }
    );
  const configDigest = artifact.body?.config?.digest;
  if (!DIGEST.test(artifact.digest) || !DIGEST.test(configDigest || ''))
    throw new GhcrGuardError('Chart artifact has an invalid digest or config', {
      code: 'malformed',
    });
  const config = await getBlob({
    owner,
    repo,
    digest: configDigest,
    token,
    fetchImpl,
    timeoutMs,
  });
  const annotations = {
    ...(artifact.body?.annotations || {}),
    ...(config?.annotations || {}),
  };
  if (String(config?.version) !== version)
    throw new GhcrGuardError('Published chart version mismatch', {
      code: 'version-mismatch',
    });
  if (String(config?.appVersion) !== appVersion)
    throw new GhcrGuardError('Published chart appVersion mismatch', {
      code: 'version-mismatch',
    });
  if (annotations['org.opencontainers.image.revision'] !== revision)
    throw new GhcrGuardError('Published chart source revision mismatch', {
      code: 'revision-mismatch',
    });
  return { digest: artifact.digest };
}

// Fails closed: resolves only when the registry authoritatively reports the tag as absent.
export async function assertTagAbsent({
    owner,
    repo,
    tag,
    username,
    password,
    fetchImpl = fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
    const token = await fetchGhcrToken({ owner, repo, username, password, fetchImpl, timeoutMs }); // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    const manifest = await getManifest({ owner, repo, tag, token, fetchImpl, timeoutMs });

    if (manifest.status === 'present') {
        throw new GhcrGuardError(
            `Artifact ${owner}/${repo}:${tag} already exists in GHCR with digest ${manifest.digest}; refusing to overwrite it`,
            { code: 'exists' }
        );
    }

    return manifest;
}

// Used only after a successful push, to record evidence. 'present' is the expected outcome
// here; any other outcome is a hard failure.
export async function describeManifest({
    owner,
    repo,
    tag,
    username,
    password,
    fetchImpl = fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
    const token = await fetchGhcrToken({ owner, repo, username, password, fetchImpl, timeoutMs }); // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    const manifest = await getManifest({ owner, repo, tag, token, fetchImpl, timeoutMs });

    if (manifest.status !== 'present') {
        throw new GhcrGuardError(
            `Expected GHCR tag ${owner}/${repo}:${tag} to exist after publish, but the registry reported it as absent`,
            { code: 'missing-after-publish' }
        );
    }

    const findDigest = (architecture) =>
        manifest.manifests.find(
            (entry) =>
                entry.os === 'linux' &&
                entry.architecture === architecture &&
                typeof entry.digest === 'string' &&
                entry.digest.trim().length > 0
        )?.digest;

    const amd64Digest = findDigest('amd64');
    const arm64Digest = findDigest('arm64');
    if (!amd64Digest || !arm64Digest) {
        throw new GhcrGuardError(
            `GHCR tag ${owner}/${repo}:${tag} does not contain non-empty digests for both required platforms linux/amd64 and linux/arm64`,
            { code: 'missing-platform' }
        );
    }

    return {
        indexDigest: manifest.digest,
        amd64Digest,
        arm64Digest,
    };
}

const FLAG_KEYS = new Set(['owner', 'repo', 'tag']);

export function parseArgs(argv) {
    const [subcommand, ...rest] = argv;

    if (subcommand !== 'check-absent' && subcommand !== 'describe') {
        throw new GhcrGuardError(
            'Usage: ghcr-manifest.mjs <check-absent|describe> --owner <owner> --repo <repo> --tag <tag>',
            { code: 'invalid-input' }
        );
    }

    const options = {};
    for (let i = 0; i < rest.length; i += 1) {
        const flag = rest[i];
        const key = flag?.startsWith('--') ? flag.slice(2) : '';
        if (!FLAG_KEYS.has(key)) {
            throw new GhcrGuardError(`Unrecognized argument: ${flag}`, { code: 'invalid-input' });
        }
        const value = rest[i + 1];
        if (!value) {
            throw new GhcrGuardError(`Missing value for --${key}`, { code: 'invalid-input' });
        }
        options[key] = value;
        i += 1;
    }

    return {
        subcommand,
        owner: requireField(options.owner, '--owner'),
        repo: requireField(options.repo, '--repo'),
        tag: requireField(options.tag, '--tag'),
    };
}

function writeGithubOutput(entries) {
    const content = entries.map(([key, value]) => `${key}=${value}`).join('\n') + '\n';
    const outputPath = process.env.GITHUB_OUTPUT;
    if (outputPath) {
        appendFileSync(outputPath, content);
    } else {
        console.log(JSON.stringify(Object.fromEntries(entries), null, 2));
    }
}

export async function main(argv = process.argv.slice(2)) {
    const { subcommand, owner, repo, tag } = parseArgs(argv);

    // Credentials are read only from the environment, never from CLI args, so they can't
    // leak through process listings or workflow logs that echo the invoked command.
    const username = process.env.GHCR_GUARD_USERNAME || '';
    const password = process.env.GHCR_GUARD_PASSWORD || ''; // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    if (!username || !password) {
        throw new GhcrGuardError('GHCR_GUARD_USERNAME and GHCR_GUARD_PASSWORD must both be set', {
            code: 'invalid-input',
        });
    }

    if (subcommand === 'check-absent') {
        await assertTagAbsent({ owner, repo, tag, username, password });
        console.log(
            `GHCR artifact ${owner}/${repo}:${tag} is not present (registry returned 404); safe to publish.`
        );
        return;
    }

    const digests = await describeManifest({ owner, repo, tag, username, password });
    writeGithubOutput([
        ['index_digest', digests.indexDigest],
        ['amd64_digest', digests.amd64Digest],
        ['arm64_digest', digests.arm64Digest],
    ]);
    console.log(`Recorded GHCR digests for ${owner}/${repo}:${tag}.`);
}

const isDirectRun = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
    main().catch((error) => {
        const message =
            error instanceof GhcrGuardError
                ? error.message
                : `Unexpected error: ${error?.message || error}`;
        console.error(message);
        process.exit(1);
    });
}
