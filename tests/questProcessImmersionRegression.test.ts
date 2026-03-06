import { describe, expect, it } from 'vitest';
import { loadQuests } from '../scripts/gen-quest-tree.mjs';

const BUILD_INTENT_PATTERN =
    /\b(build|install|assemble|construct|fabricate|mount|enclosure|digester|reactor|greenhouse|rack)\b/i;

const BUILD_INTENT_EXCEPTIONS = new Set<string>([
    'woodworking/finish-sanding',
]);

describe('quest process immersion regression', () => {
    it('build/install quests require at least one process option', async () => {
        const quests = await loadQuests();
        const offenders: string[] = [];

        for (const quest of quests as any[]) {
            const intentText = `${quest.title ?? ''} ${quest.description ?? ''}`;
            if (!BUILD_INTENT_PATTERN.test(intentText)) continue;
            if (BUILD_INTENT_EXCEPTIONS.has(quest.id)) continue;

            const hasProcessOption = (quest.dialogue ?? []).some((node: any) =>
                (node.options ?? []).some((option: any) => option.type === 'process')
            );

            if (!hasProcessOption) {
                offenders.push(`${quest.id} (${quest.title})`);
            }
        }

        expect(
            offenders,
            `Build/installation quests without process options:\n${offenders.join('\n')}`
        ).toEqual([]);
    });

    it('keeps no-process quests as a small minority', async () => {
        const quests = await loadQuests();
        const withoutProcess = (quests as any[]).filter(
            (quest) =>
                !(quest.dialogue ?? []).some((node: any) =>
                    (node.options ?? []).some((option: any) => option.type === 'process')
                )
        );

        const ratio = withoutProcess.length / quests.length;

        expect(withoutProcess.length).toBeLessThanOrEqual(40);
        expect(ratio).toBeLessThanOrEqual(0.2);
    });
});
