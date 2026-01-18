import 'fake-indexeddb/auto';
import { vi } from 'vitest';
// Note: jest-dom matchers are imported per-test to avoid setup-time dependency issues.
// Avoid importing @testing-library/jest-dom here because some root test runs omit it.
// Provide a Jest-like global for migrated tests
(globalThis as any).jest = vi;
