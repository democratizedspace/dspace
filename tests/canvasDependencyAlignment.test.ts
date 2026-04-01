import { describe, expect, it } from 'vitest';
import frontendPackage from '../frontend/package.json';

describe('canvas dependency alignment', () => {
  it('does not keep a stale direct frontend canvas dependency', () => {
    expect(frontendPackage.dependencies).not.toHaveProperty('canvas');
  });
});
