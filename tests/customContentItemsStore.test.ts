import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../frontend/src/utils/customcontent.js';
import { getItems } from '../frontend/src/utils/indexeddb.js';

// Ensure fake crypto for UUID
if (!globalThis.crypto?.randomUUID) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomUUID } = require('crypto');
  globalThis.crypto = { ...(globalThis.crypto as any), randomUUID } as Crypto;
}

describe('custom content item storage', () => {
  it('stores new items in items object store', async () => {
    const id = crypto.randomUUID();
    await db.items.add({ id, name: 'Temp Item', description: 'Test description' });
    const items = await getItems();
    const stored = items.find((i: any) => i.id === id);
    expect(stored?.name).toBe('Temp Item');
  });
});
