import 'fake-indexeddb/auto';
import { vi } from 'vitest';
// Note: jest-dom matchers are imported per-test to avoid setup-time dependency issues.
// Provide a Jest-like global for migrated tests
(globalThis as any).jest = vi;
