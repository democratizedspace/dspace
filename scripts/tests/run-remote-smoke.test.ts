import { describe, expect, it } from 'vitest';
import {
  buildRemoteSmokeEnv,
  isLocalHostTarget,
  parseArgs,
} from '../run-remote-smoke.mjs';

describe('run-remote-smoke argument parsing', () => {
  it('enables custom-item mutation by default', () => {
    const parsed = parseArgs([]);
    expect(parsed.mutate).toBe(true);
  });

  it('supports explicit opt-out via --no-mutate and --safe', () => {
    expect(parseArgs(['--no-mutate']).mutate).toBe(false);
    expect(parseArgs(['--safe']).mutate).toBe(false);
  });

  it('allows explicit re-enable with --mutate when flags are mixed', () => {
    expect(parseArgs(['--no-mutate', '--mutate']).mutate).toBe(true);
    expect(parseArgs(['--mutate', '--no-mutate']).mutate).toBe(false);
  });
});

describe('run-remote-smoke env wiring', () => {
  it('wires REMOTE_SMOKE_MUTATION based on parsed mutate mode', () => {
    const enabled = buildRemoteSmokeEnv(parseArgs([]), {});
    const disabled = buildRemoteSmokeEnv(parseArgs(['--no-mutate']), {});

    expect(enabled.REMOTE_SMOKE_MUTATION).toBe('1');
    expect(disabled.REMOTE_SMOKE_MUTATION).toBe('0');
  });

  it('detects localhost targets for managed webServer mode', () => {
    expect(isLocalHostTarget('http://127.0.0.1:4173')).toBe(true);
    expect(isLocalHostTarget('http://localhost:4173')).toBe(true);
    expect(isLocalHostTarget('https://staging.democratized.space')).toBe(false);
  });
});
