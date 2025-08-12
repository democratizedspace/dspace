import { describe, it, expect } from 'vitest';
import processes from '../frontend/src/generated/processes.json';
import fs from 'fs';
import path from 'path';

describe('process hardening metadata', () => {
  it('reinjects all hardening files', () => {
    const hardeningDir = path.join(__dirname, '../frontend/src/pages/processes/hardening');
    const hardeningFiles = fs.readdirSync(hardeningDir);
    const withHardening = (processes as Array<any>).filter(p => p.hardening).length;
    expect(withHardening).toBe(hardeningFiles.length);
  });
});
