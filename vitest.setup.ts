import 'fake-indexeddb/auto';
import { vi } from 'vitest';
void import('@testing-library/jest-dom').catch(() => undefined);
// Provide a Jest-like global for migrated tests
(globalThis as any).jest = vi;
