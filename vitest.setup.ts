import { vi } from 'vitest';
// Provide a Jest-like global for migrated tests
(globalThis as any).jest = vi;
