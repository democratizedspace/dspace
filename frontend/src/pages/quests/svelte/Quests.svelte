<script>
    import Quest from './Quest.svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import { onDestroy, onMount } from 'svelte';
    import { questFinished, canStartQuest } from '../../../utils/gameState.js';
    import { listCustomQuests } from '../../../utils/customcontent.js';
    import { loadGameState, state, ready } from '../../../utils/gameState/common.js';
    import { isBrowser } from '../../../utils/ssr.js';

    export let quests = [];
    let filteredQuests = [];
    let finishedQuests = [];
    let mounted = false;
    let customQuestRecords = [];
    let normalizedBuiltInQuests = [];
    let normalizedCustomQuests = [];
    let showQuestGraphVisualizer = false;
    let unsubscribeState;
    let hasMarkedListVisible = false;

    const markPerf = (name) => {
        if (!isBrowser || typeof performance?.mark !== 'function') {
            return;
        }
        performance.mark(name);
    };

    const measurePerf = (name, start, end) => {
        if (!isBrowser || typeof performance?.measure !== 'function') {
            return;
        }
        try {
            performance.measure(name, start, end);
        } catch {
            // no-op
        }
    };

    const normalizeQuest = (entry) => {
        if (!entry) {
            return null;
        }

        const questData = entry.default ?? entry;
        if (!questData || !questData.id) {
            return null;
        }

        const requiresQuests = Array.isArray(questData.requiresQuests)
            ? questData.requiresQuests.filter((id) => typeof id === 'string' && id.trim() !== '')
            : [];

        const normalizedDefault = questData.default
            ? {
                  ...questData.default,
                  requiresQuests: Array.isArray(questData.default.requiresQuests)
                      ? questData.default.requiresQuests
                      : requiresQuests,
              }
            : { requiresQuests };

        return {
            ...questData,
            id: questData.id,
            requiresQuests,
            default: normalizedDefault,
        };
    };

    const normalizeQuestList = (entries = []) => {
        const normalized = [];
        for (const quest of entries ?? []) {
            const prepared = normalizeQuest(quest);
            if (prepared) {
                normalized.push(prepared);
            }
        }
        return normalized;
    };

    const dedupeById = (questList = []) => {
        const byId = new Map();
        for (const quest of questList) {
            const key = String(quest.id);
            byId.set(key, quest);
        }
        return Array.from(byId.values());
    };

    const safeQuestFinished = (quest) => {
        try {
            return questFinished(quest.id);
        } catch (error) {
            console.error('Unable to determine quest completion status', error);
            return false;
        }
    };

    const safeCanStartQuest = (quest) => {
        try {
            return canStartQuest(quest);
        } catch (error) {
            console.error('Unable to evaluate quest prerequisites', error);
            return true;
        }
    };

    onMount(async () => {
        markPerf('quests:list-hydration-start');
        await ready;
        mounted = true;
        const initialState = loadGameState();
        showQuestGraphVisualizer = Boolean(initialState.settings?.showQuestGraphVisualizer);

        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (!hasMarkedListVisible) {
            hasMarkedListVisible = true;
            markPerf('quests:list-visible');
            markPerf('quests:snapshot-classification-ready');
            measurePerf(
                'quests:time-to-list-visible',
                'quests:list-hydration-start',
                'quests:list-visible'
            );
            measurePerf(
                'quests:time-to-snapshot-classification',
                'quests:list-hydration-start',
                'quests:snapshot-classification-ready'
            );
        }

        unsubscribeState = state.subscribe((value) => {
            showQuestGraphVisualizer = Boolean(value?.settings?.showQuestGraphVisualizer);
        });

        try {
            const questsFromStorage = await listCustomQuests();
            customQuestRecords = Array.isArray(questsFromStorage) ? questsFromStorage : [];
        } catch (error) {
            console.error('Unable to load custom quests for listing:', error);
            customQuestRecords = [];
        } finally {
            markPerf('quests:full-state-reconciliation-complete');
            measurePerf(
                'quests:time-to-full-reconciliation',
                'quests:list-hydration-start',
                'quests:full-state-reconciliation-complete'
            );
        }
    });

    onDestroy(() => {
        unsubscribeState?.();
    });

    $: normalizedBuiltInQuests = normalizeQuestList(quests);
    $: normalizedCustomQuests = normalizeQuestList(customQuestRecords);

    $: if (mounted) {
        const _gs = $state; // rerun when game state updates
        const combinedQuests = dedupeById([...normalizedBuiltInQuests, ...normalizedCustomQuests]);
        filteredQuests = [];
        finishedQuests = [];
        combinedQuests.forEach((quest) => {
            if (safeQuestFinished(quest)) {
                finishedQuests.push(quest);
            } else if (safeCanStartQuest(quest)) {
                filteredQuests.push(quest);
            }
        });
    }

    // Define buttons for easy expansion
    const actionButtons = [
        { text: 'Create a new quest', href: '/quests/create' },
        { text: 'Manage quests', href: '/quests/manage' },
    ];
</script>

<div class="container">
    {#if mounted}
        <div class="action-buttons">
            {#each actionButtons as button}
                <Chip text={button.text} href={button.href} inverted={true} />
            {/each}
        </div>

        <div class="quests-grid" data-testid="quests-grid">
            {#each filteredQuests as quest}
                <a href="/quests/{quest.id}" aria-label={quest.title}>
                    <Quest {quest} />
                </a>
            {/each}
        </div>

        {#if showQuestGraphVisualizer}
            <div class="visualizer-slot">
                <slot name="visualizer" />
            </div>
        {/if}

        {#if finishedQuests.length > 0}
            <h2>Completed Quests</h2>
            {#each finishedQuests as quest}
                <a href="/quests/{quest.id}" aria-label={quest.title}>
                    <Quest {quest} compact={true} />
                </a>
            {/each}
        {/if}
    {/if}
</div>

<style>
    .container {
        width: 100%;
        max-width: 100%;
        min-width: 0;
        box-sizing: border-box;
        margin-inline: auto;
        padding-inline: 0.5rem;
        overflow-x: clip;
    }

    a {
        text-decoration: none;
        display: block;
        margin: 0;
    }

    .action-buttons {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 20px;
    }

    .quests-grid {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: stretch;
        gap: 20px;
    }

    .quests-grid > a {
        display: flex;
        align-items: stretch;
        width: min(400px, 100%);
    }

    .quests-grid > a :global([data-testid='quest-tile']) {
        flex: 1 1 auto;
        height: auto;
    }

    @media only screen and (max-width: 640px) {
        .container {
            padding-inline: 1rem;
        }

        .quests-grid > a {
            width: 100%;
        }
    }

    .visualizer-slot {
        margin: 30px 0;
        width: 100%;
        max-width: 100%;
        min-width: 0;
    }
</style>
