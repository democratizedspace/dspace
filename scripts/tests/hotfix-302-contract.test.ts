import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  hotfix302,
  verifyHotfixArtifact,
  validateHotfixRuntime,
} from '../hotfix-302-contract.mjs';
import {
  parseAndValidateArgs,
  buildSmokeEnv,
} from '../run-remote-chat-smoke.mjs';
import {
  validateProviderConfig,
  chatUiContractFor,
} from '../../frontend/e2e/remote-chat-smoke-contract';

const options = {
  expectedVersion: hotfix302.version,
  expectedRevision: hotfix302.revision,
  expectedImageDigest: hotfix302.imageDigest,
  expectedProvider: hotfix302.provider,
  identityContract: hotfix302.identityContract,
  providerConfigContract: hotfix302.providerConfigContract,
};
const meta = {
  gitSha: hotfix302.revision,
  generatedAt: '2026-10-31T23:34:25.629Z',
  source: 'env',
};
const health = { status: 'ready', version: hotfix302.imageVersionLabel };
const config = {
  offlineWorker: { enabled: true },
  telemetry: { enabled: false },
  featureFlags: [],
};
const argv = Object.entries(options).flatMap(([key, value]) => {
  const flags = {
    expectedVersion: 'expected-version',
    expectedRevision: 'expected-revision',
    expectedImageDigest: 'expected-image-digest',
    expectedProvider: 'expected-provider',
    identityContract: 'identity-contract',
    providerConfigContract: 'provider-config-contract',
  };
  return [`--${flags[key as keyof typeof flags]}`, value];
});

describe('exact hotfix artifact, runtime, and provider contracts', () => {
  it('extracts version from both digest-authenticated platform configs, not health or argv', () => {
    expect(verifyHotfixArtifact(options)).toEqual({
      method: 'sha256-index-platform-config-version-label',
      applicationVersion: '3.0.2',
      sourceRevision: hotfix302.revision,
      imageDigest: hotfix302.imageDigest,
      imageVersionLabel: 'v3.0.2+4790074',
    });
    expect(
      validateHotfixRuntime(meta, health, options).applicationVersion
    ).toBe('3.0.2');
  });
  it.each(Object.keys(options))(
    'rejects changed/missing coordinate %s',
    (key) => {
      expect(() =>
        verifyHotfixArtifact({ ...options, [key]: 'drift' })
      ).toThrow();
      expect(() =>
        verifyHotfixArtifact({ ...options, [key]: undefined })
      ).toThrow();
    }
  );
  it.each([
    'index',
    'amd64-manifest',
    'amd64-config',
    'arm64-manifest',
    'arm64-config',
    'missing-platform',
  ])('rejects corrupt proof %s', (field) => {
    const bundle = JSON.parse(
      readFileSync('scripts/fixtures/hotfix-302-oci-proof.json', 'utf8')
    );
    if (field === 'index') bundle.index = Buffer.from('{}').toString('base64');
    else if (field === 'missing-platform') bundle.platforms.pop();
    else {
      const [arch, kind] = field.split('-');
      bundle.platforms[arch === 'amd64' ? 0 : 1][kind] =
        Buffer.from('{}').toString('base64');
    }
    expect(() => verifyHotfixArtifact(options, bundle)).toThrow();
  });
  it.each([
    '3.0.2',
    'spoofed',
    `hotfix-${hotfix302.revision}@${hotfix302.imageDigest}`,
    undefined,
  ])(
    'rejects health configuration drift %s without using it as version proof',
    (version) => {
      expect(() =>
        validateHotfixRuntime(meta, { ...health, version }, options)
      ).toThrow('configuration drift');
    }
  );
  it.each([
    { ...meta, gitSha: 'f'.repeat(40) },
    { ...meta, generatedAt: 'invalid' },
    { ...meta, source: '' },
    { ...meta, version: '3.0.2' },
  ])('rejects bad runtime metadata', (bad) => {
    expect(() => validateHotfixRuntime(bad, health, options)).toThrow();
  });
  it('accepts actual runner argv and propagates digest, proof, and exact UI contract', () => {
    const parsed = parseAndValidateArgs(
      ['--base-url', 'https://staging.example', ...argv],
      {}
    );
    expect(parsed.artifactVersionEvidence.applicationVersion).toBe('3.0.2');
    expect(buildSmokeEnv(parsed, {}).DSPACE_EXPECTED_IMAGE_DIGEST).toBe(
      hotfix302.imageDigest
    );
    expect(
      chatUiContractFor(parsed.identityContract, parsed.expectedProvider)
    ).toBe('legacy-inline-openai-v1');
    expect(() =>
      validateProviderConfig(
        config,
        parsed.providerConfigContract,
        parsed.expectedProvider
      )
    ).not.toThrow();
  });
  it('inspects the existing local image without building the runner checkout', () => {
    const parsed = parseAndValidateArgs(
      ['--base-url', 'http://127.0.0.1:18082', ...argv],
      {}
    );
    expect(buildSmokeEnv(parsed, {}).REMOTE_CHAT_SMOKE_USE_WEBSERVER).toBe('0');
  });
  it.each([
    { ...config, chat: { defaultProvider: 'openai' } },
    { ...config, tokenPlace: {} },
    {},
    { ...config, featureFlags: [true] },
    { ...config, telemetry: { enabled: 'true' } },
  ])(
    'rejects wrong provider config rather than silently falling back',
    (bad) => {
      expect(() =>
        validateProviderConfig(bad, 'hotfix-openai-config-v1', 'openai')
      ).toThrow();
    }
  );
  it('never accepts token-place or grants this exception to the standard contract', () => {
    expect(() =>
      validateProviderConfig(config, 'hotfix-openai-config-v1', 'token-place')
    ).toThrow();
    expect(() =>
      validateProviderConfig(config, 'chat-default-provider-v1', 'openai')
    ).toThrow('LIVE_DEFAULT_PROVIDER_DISAGREEMENT');
  });
});
