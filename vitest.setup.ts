import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// Jest-dom is only installed in the frontend workspace; keep it out of root setup.
// Provide a Jest-like global for migrated tests.
(globalThis as any).jest = vi;

if (typeof navigator !== 'undefined' && !navigator.locks) {
  let lockQueue = Promise.resolve();
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: (_name: string, callback: () => unknown) => {
        const result = lockQueue.then(callback, callback);
        lockQueue = result.then(
          () => undefined,
          () => undefined
        );
        return result;
      },
    },
  });
}
