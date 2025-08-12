import fs from 'fs';
import path from 'path';

describe('sysadmin quest tree', () => {
  it('includes the basic commands quest', () => {
    const file = path.join(
      __dirname,
      '../frontend/src/pages/quests/json/sysadmin/basic-commands.json'
    );
    const quest = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(quest.id).toBe('sysadmin/basic-commands');
  });
});
