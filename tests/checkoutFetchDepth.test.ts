import { readFileSync } from 'fs';
import { join } from 'path';

describe('CI workflow checkout', () => {
  it('fetches full history for origin/v3', () => {
    const ciPath = join(__dirname, '..', '.github', 'workflows', 'ci.yml');
    const contents = readFileSync(ciPath, 'utf8');
    expect(contents).toMatch(/fetch-depth:\s*0/);
  });
});
