import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const profilePage = path.resolve(
  __dirname,
  '../frontend/src/pages/profile/index.astro'
);

describe('Profile page', () => {
  it('hydrates the profile titles component', () => {
    const content = readFileSync(profilePage, 'utf8');
    expect(content).toMatch(/<ProfileTitles client:load \/>/);
  });
});
