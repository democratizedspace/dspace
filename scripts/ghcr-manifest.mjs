#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

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

async function fetchWithTimeout(fetchImpl, url, init, timeoutMs, describeAction, consume) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let receivedResponse = false;
    try {
        const response = await fetchImpl(url, { ...init, signal: controller.signal });
        receivedResponse = true;
        return consume ? await consume(response) : response;
    } catch (error) {
        if (controller.signal.aborted || error?.name === 'AbortError') {
            throw new GhcrGuardError(`Timed out after ${timeoutMs}ms while ${describeAction}`, {
                code: 'timeout',
            });
        }
        // The only consumer is the 404 parser, which sanitizes its errors below.
        if (receivedResponse && error instanceof GhcrGuardError) throw error;
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

// Returns { status: 'absent' } only on an authenticated MANIFEST_UNKNOWN registry 404. Every other outcome
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
        'requesting the GHCR manifest',
        async (response) => {
            if (response.status !== 404) return response;

            // A proxy, unknown repository, or masked authorization failure can also
            // return 404. Only an unambiguous registry manifest-absence envelope
            // permits publication; read it under the same request deadline.
            let body;
            try {
                body = await response.json();
            } catch (error) {
                if (error?.name === 'AbortError') throw error;
                throw new GhcrGuardError('GHCR manifest 404 response was not valid JSON', {
                    code: 'indeterminate',
                });
            }
            if (
                !Array.isArray(body?.errors) ||
                body.errors.length === 0 ||
                !body.errors.every((error) => error?.code === 'MANIFEST_UNKNOWN')
            ) {
                throw new GhcrGuardError('GHCR manifest 404 did not establish manifest absence', {
                    code: 'indeterminate',
                });
            }
            return null;
        }
    );

    if (response === null) return { status: 'absent' };

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

const VERIFICATION_TIMEOUT_MS = 30000;
const READ_BACKOFF_MS = [1000, 2000, 4000];
const RETRY_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const RETRY_TRANSPORT_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_SOCKET',
]);

// This is only for verification of artifacts expected to exist; the absence guard
// deliberately retains its independent, non-retrying path.
async function readVerificationBytes({
  fetchImpl,
  url,
  headers,
  timeoutMs,
  stage,
  allowMissing,
}) {
  for (let attempt = 0; ; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let retry;
    try {
      const response = await fetchImpl(url, {
        method: 'GET',
        redirect: 'error',
        headers,
        signal: controller.signal,
      });
      if (response.status === 200) {
        // Keep the same deadline active until the last body byte arrives.
        const bytes = Buffer.from(await response.arrayBuffer());
        return { headers: response.headers, bytes };
      }
      // Neither print nor consume an error body or redirect location.
      void response.body?.cancel().catch(() => {});
      if (response.status === 404 && allowMissing) return null;
      if (!RETRY_STATUSES.has(response.status)) {
        const code = [401, 403].includes(response.status)
          ? 'auth'
          : 'indeterminate';
        throw new GhcrGuardError(
          `GHCR ${stage} returned HTTP ${response.status}`,
          { code }
        );
      }
      retry = { reason: `HTTP ${response.status}`, code: 'indeterminate' };
    } catch (error) {
      if (error instanceof GhcrGuardError) throw error;
      if (controller.signal.aborted) {
        retry = { reason: 'request deadline exceeded', code: 'timeout' };
      } else if (RETRY_TRANSPORT_CODES.has(error?.cause?.code ?? error?.code)) {
        retry = { reason: 'transient transport failure', code: 'network' };
      } else {
        throw new GhcrGuardError(
          `GHCR ${stage} encountered a non-retryable transport failure`,
          {
            code: 'network',
          }
        );
      }
    } finally {
      clearTimeout(timer);
    }
    if (attempt === READ_BACKOFF_MS.length) {
      throw new GhcrGuardError(
        `GHCR ${stage}: ${retry.reason}; exhausted 4 attempts`,
        {
          code: retry.code,
        }
      );
    }
    await new Promise((resolve) =>
      setTimeout(resolve, READ_BACKOFF_MS[attempt])
    );
  }
}

function verifyBytes(bytes, expected, stage) {
  if (!DIGEST.test(expected ?? '')) {
    throw new GhcrGuardError(
      `GHCR ${stage} has an invalid or missing SHA-256 digest`,
      {
        code: 'malformed',
      }
    );
  }
  if (
    `sha256:${createHash('sha256').update(bytes).digest('hex')}` !== expected
  ) {
    throw new GhcrGuardError(
      `GHCR ${stage} bytes do not match the expected digest`,
      {
        code: 'digest-mismatch',
      }
    );
  }
}

function verificationJson(bytes, stage) {
  let body;
  try {
    body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new GhcrGuardError(`GHCR ${stage} has an invalid JSON body`, {
      code: 'malformed',
    });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new GhcrGuardError(`GHCR ${stage} requires a JSON object`, {
      code: 'malformed',
    });
  }
  return body;
}

async function fetchVerificationToken({
  owner,
  repo,
  username,
  password,
  fetchImpl,
  timeoutMs,
}) {
  requireField(owner, 'owner');
  requireField(repo, 'repo');
  requireField(username, 'username');
  requireField(password, 'password');
  const scope = `repository:${owner}/${repo}:pull`;
  const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
  const stage = 'verification token';
  const { bytes } = await readVerificationBytes({
    fetchImpl,
    url: `${REGISTRY_HOST}/token?service=ghcr.io&scope=${encodeURIComponent(scope)}`,
    headers: { Authorization: `Basic ${basicAuth}` },
    timeoutMs,
    stage,
  });
  const { token } = verificationJson(bytes, stage);
  if (typeof token !== 'string' || !token) {
    throw new GhcrGuardError('GHCR token response did not include a token', {
      code: 'malformed',
    });
  }
  return token;
}

async function getVerifiedManifest({
  owner,
  repo,
  tag,
  token,
  fetchImpl,
  timeoutMs,
}) {
  requireField(tag, 'tag');
  const stage = 'verification manifest';
  const result = await readVerificationBytes({
    fetchImpl,
    url: `${REGISTRY_HOST}/v2/${owner}/${repo}/manifests/${encodeURIComponent(tag)}`,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: MANIFEST_ACCEPT_HEADER,
    },
    timeoutMs,
    stage,
    allowMissing: true,
  });
  if (!result) return { status: 'absent' };
  const digest = result.headers.get('docker-content-digest');
  verifyBytes(result.bytes, digest, stage);
  const body = verificationJson(result.bytes, stage);
  if (body.schemaVersion !== 2) {
    throw new GhcrGuardError(
      'GHCR verification manifest must use schemaVersion 2',
      {
        code: 'malformed',
      }
    );
  }
  return { status: 'present', digest, body };
}

function runtimeDigests(body) {
  const linux = Array.isArray(body.manifests)
    ? body.manifests.filter((entry) => entry?.platform?.os === 'linux')
    : [];
  const amd64 = linux.filter(
    (entry) => entry.platform.architecture === 'amd64'
  );
  const arm64 = linux.filter(
    (entry) => entry.platform.architecture === 'arm64'
  );
  if (
    linux.length !== 2 ||
    amd64.length !== 1 ||
    arm64.length !== 1 ||
    !DIGEST.test(amd64[0].digest ?? '') ||
    !DIGEST.test(arm64[0].digest ?? '') ||
    amd64[0].digest === arm64[0].digest
  ) {
    throw new GhcrGuardError(
      'Image requires exactly one distinct linux/amd64 and linux/arm64 manifest',
      {
        code: 'missing-platform',
      }
    );
  }
  return { amd64: amd64[0].digest, arm64: arm64[0].digest };
}

async function getVerifiedBlob({
  owner,
  repo,
  digest,
  token,
  fetchImpl = fetch,
  timeoutMs = VERIFICATION_TIMEOUT_MS,
}) {
  requireField(owner, 'owner');
  requireField(repo, 'repo');
  requireField(token, 'token');
  if (!DIGEST.test(digest)) {
    throw new GhcrGuardError('Invalid OCI blob digest', { code: 'malformed' });
  }
  const stage = 'verification blob';
  const result = await readVerificationBytes({
    fetchImpl,
    url: `${REGISTRY_HOST}/v2/${owner}/${repo}/blobs/${digest}`,
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs,
    stage,
  });
  verifyBytes(result.bytes, digest, stage);
  const headerDigest = result.headers.get('docker-content-digest');
  if (headerDigest !== null && headerDigest !== digest) {
    throw new GhcrGuardError(
      'GHCR blob digest header does not match its descriptor',
      {
        code: 'digest-mismatch',
      }
    );
  }
  return verificationJson(result.bytes, stage);
}

// Existing workflows retain their current reads until the strict registry path
// has compatibility evidence. No release CLI entry point opts in.
function verificationReaders(boundedReads) {
  return boundedReads === true
    ? { acquireCredential: fetchVerificationToken, readManifest: getVerifiedManifest, readBlob: getVerifiedBlob }
    : { acquireCredential: fetchGhcrToken, readManifest: getManifest, readBlob: getBlob };
}

export async function inspectImage({
  owner,
  repo,
  tag,
  username,
  password,
  revision,
  fetchImpl = fetch,
  boundedReads = false,
  timeoutMs = boundedReads === true ? VERIFICATION_TIMEOUT_MS : DEFAULT_TIMEOUT_MS,
}) {
  const { acquireCredential, readManifest, readBlob } = verificationReaders(boundedReads);
  const token = await acquireCredential({ // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    owner,
    repo,
    username,
    password,
    fetchImpl,
    timeoutMs,
  });
  const index = await readManifest({
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
  const platforms = boundedReads === true ? runtimeDigests(index.body) : {};
  for (const architecture of ['amd64', 'arm64']) {
    if (boundedReads !== true) {
      const candidates = index.manifests.filter(
        (item) => item.os === 'linux' && item.architecture === architecture
      );
      if (candidates.length !== 1 || !DIGEST.test(candidates[0].digest)) {
        throw new GhcrGuardError(
          `Image requires exactly one linux/${architecture} manifest`,
          { code: 'missing-platform' }
        );
      }
      platforms[architecture] = candidates[0].digest;
    }
    const manifest = await readManifest({
      owner,
      repo,
      tag: platforms[architecture],
      token,
      fetchImpl,
      timeoutMs,
    });
    if (manifest.status !== 'present' || manifest.digest !== platforms[architecture])
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
    const config = await readBlob({
      owner,
      repo,
      digest: configDigest,
      token,
      fetchImpl,
      timeoutMs,
    });
    if (boundedReads === true && (config.architecture !== architecture || config.os !== 'linux')) {
      throw new GhcrGuardError('GHCR config platform does not match its index descriptor', {
        code: 'platform-mismatch',
      });
    }
    if (
      config?.config?.Labels?.['org.opencontainers.image.revision'] !== revision
    ) {
      throw new GhcrGuardError(
        `linux/${architecture} image revision label does not match approved source`,
        { code: 'revision-mismatch' }
      );
    }
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
  boundedReads = false,
  timeoutMs = boundedReads === true ? VERIFICATION_TIMEOUT_MS : DEFAULT_TIMEOUT_MS,
}) {
  const { acquireCredential, readManifest, readBlob } = verificationReaders(boundedReads);
  const token = await acquireCredential({ // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    owner,
    repo,
    username,
    password,
    fetchImpl,
    timeoutMs,
  });
  const artifact = await readManifest({
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
  const config = await readBlob({
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
    boundedReads = false,
    timeoutMs = boundedReads === true ? VERIFICATION_TIMEOUT_MS : DEFAULT_TIMEOUT_MS,
}) {
    const { acquireCredential, readManifest } = verificationReaders(boundedReads);
    const token = await acquireCredential({ owner, repo, username, password, fetchImpl, timeoutMs }); // scan-secrets: ignore (fixture/env credential plumbing; no real secret literal)
    const manifest = await readManifest({ owner, repo, tag, token, fetchImpl, timeoutMs });

    if (manifest.status !== 'present') {
        throw new GhcrGuardError(
            `Expected GHCR tag ${owner}/${repo}:${tag} to exist after publish, but the registry reported it as absent`,
            { code: 'missing-after-publish' }
        );
    }

    if (boundedReads === true) {
        const { amd64, arm64 } = runtimeDigests(manifest.body);
        return { indexDigest: manifest.digest, amd64Digest: amd64, arm64Digest: arm64 };
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
