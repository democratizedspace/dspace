import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// Jest-dom is only installed in the frontend workspace; keep it out of root setup.
// Provide a Jest-like global for migrated tests.
(globalThis as any).jest = vi;
