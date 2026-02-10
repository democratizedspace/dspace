import fs from 'node:fs';
import path from 'node:path';

describe('quest copy regressions', () => {
    it('keeps smart plug tax notes aligned with dCarbon tax mechanics', () => {
        const questPath = path.join(
            process.cwd(),
            'frontend/src/pages/quests/json/welcome/smart-plug-test.json'
        );
        const quest = JSON.parse(fs.readFileSync(questPath, 'utf8')) as {
            dialogue?: Array<{ id?: string; text?: string }>;
        };
        const text = quest.dialogue?.find((node) => node.id === 'what-it-means')?.text ?? '';

        expect(text).not.toContain('deducted from the sale value');
        expect(text).not.toContain('exact deduction');
        expect(text).toContain('depends on how much dCarbon you currently hold');
        expect(text).toContain('spend dUSD to pay down dCarbon and mint dOffset');
    });
});
