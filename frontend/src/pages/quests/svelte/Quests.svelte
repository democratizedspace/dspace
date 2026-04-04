<script>
    import Quest from './Quest.svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import { onDestroy, onMount } from 'svelte';
    import { listCustomQuests } from '../../../utils/customcontent.js';
    import {
        getPersistedQuestProgressSnapshot,
        isGameStateReady,
        loadGameState,
        ready,
        state,
    } from '../../../utils/gameState/common.js';
    import { classifyQuestList } from '../questListClassifier.js';
    import { QUESTS_PERF_MARKS, markQuestPerf, measureQuestPerf } from '../perfMarks.js';

    export let quests = [];
    let builtInQuestCards = [];
    let customQuestCards = [];
    let showQuestGraphVisualizer = false;
    let fullState = null;
    let snapshot = null;
    let unsubscribeState;

    const actionButtons = [
        { text: 'Create a new quest', href: '/quests/create' },
        { text: 'Manage quests', href: '/quests/manage' },
    ];

    const normalizeQuestSummary = (entry, kind = 'builtin') => {
        if (!entry) return null;

        const questData = entry.default ?? entry;
        if (!questData || typeof questData.id !== 'string' || !questData.id.trim()) {
            return null;
        }

        const id = questData.id.trim();
        const requiresQuests = Array.isArray(questData.requiresQuests)
            ? questData.requiresQuests
                  .filter((value) => typeof value === 'string')
                  .map((value) => value.trim())
                  .filter(Boolean)
            : [];

        return {
            id,
            title: typeof questData.title === 'string' ? questData.title : id,
            description: typeof questData.description === 'string' ? questData.description : '',
            image:
                typeof questData.image === 'string' && questData.image
                    ? questData.image
                    : '/assets/quests/howtodoquests.jpg',
            route:
                typeof questData.route === 'string' && questData.route
                    ? questData.route
                    : `/quests/${id}`,
            requiresQuests,
            kind,
        };
    };

    const dedupeById = (questList = []) => {
        const byId = new Map();
        for (const quest of questList) {
            byId.set(quest.id, quest);
        }
        return Array.from(byId.values());
    };

    onMount(async () => {
        markQuestPerf(QUESTS_PERF_MARKS.HYDRATION_START);

        const normalizedBuiltins = dedupeById(
            (quests ?? []).map((quest) => normalizeQuestSummary(quest)).filter(Boolean)
        );
        builtInQuestCards = classifyQuestList({
            questSummaries: normalizedBuiltins,
            snapshot: null,
            fullState: null,
        });
        markQuestPerf(QUESTS_PERF_MARKS.BUILTIN_VISIBLE);
        measureQuestPerf(
            'quests:time-to-builtin-visible',
            QUESTS_PERF_MARKS.HYDRATION_START,
            QUESTS_PERF_MARKS.BUILTIN_VISIBLE
        );

        try {
            snapshot = await getPersistedQuestProgressSnapshot();
            builtInQuestCards = classifyQuestList({
                questSummaries: normalizedBuiltins,
                snapshot,
                fullState: null,
            });
        } catch (error) {
            console.error('Unable to load quest progress snapshot:', error);
            snapshot = null;
        } finally {
            markQuestPerf(QUESTS_PERF_MARKS.SNAPSHOT_READY);
            measureQuestPerf(
                'quests:time-to-snapshot-classification',
                QUESTS_PERF_MARKS.HYDRATION_START,
                QUESTS_PERF_MARKS.SNAPSHOT_READY
            );
        }

        try {
            const questsFromStorage = await listCustomQuests();
            const normalizedCustom = dedupeById(
                (Array.isArray(questsFromStorage) ? questsFromStorage : [])
                    .map((quest) => normalizeQuestSummary(quest, 'custom'))
                    .filter(Boolean)
            );
            customQuestCards = classifyQuestList({
                questSummaries: normalizedCustom,
                snapshot,
                fullState: null,
            });
        } catch (error) {
            console.error('Unable to load custom quests for listing:', error);
            customQuestCards = [];
        } finally {
            markQuestPerf(QUESTS_PERF_MARKS.CUSTOM_READY);
            measureQuestPerf(
                'quests:time-to-custom-merged',
                QUESTS_PERF_MARKS.HYDRATION_START,
                QUESTS_PERF_MARKS.CUSTOM_READY
            );
        }

        const updateFromState = (currentState) => {
            showQuestGraphVisualizer = Boolean(currentState?.settings?.showQuestGraphVisualizer);
            if (!isGameStateReady()) {
                return;
            }

            fullState = loadGameState();
            builtInQuestCards = classifyQuestList({
                questSummaries: normalizedBuiltins,
                snapshot,
                fullState,
            });

            if (customQuestCards.length > 0) {
                customQuestCards = classifyQuestList({
                    questSummaries: customQuestCards,
                    snapshot,
                    fullState,
                });
            }

            markQuestPerf(QUESTS_PERF_MARKS.FULL_STATE_READY);
            measureQuestPerf(
                'quests:time-to-full-state-reconciled',
                QUESTS_PERF_MARKS.HYDRATION_START,
                QUESTS_PERF_MARKS.FULL_STATE_READY
            );
        };

        await ready;
        updateFromState(loadGameState());
        unsubscribeState = state.subscribe(updateFromState);
    });

    onDestroy(() => {
        unsubscribeState?.();
    });
</script>

<div class="container" data-testid="quests-container">
    <div class="action-buttons">
        {#each actionButtons as button}
            <Chip text={button.text} href={button.href} inverted={true} />
        {/each}
    </div>

    <div class="quests-grid" data-testid="quests-grid">
        {#each builtInQuestCards as quest}
            <a href={quest.route} aria-label={quest.title}>
                <Quest {quest} />
            </a>
        {/each}
    </div>

    {#if customQuestCards.length > 0}
        <h2 class="custom-heading">Custom Quests</h2>
        <div class="quests-grid custom-grid" data-testid="custom-quests-grid">
            {#each customQuestCards as quest}
                <a href={quest.route} aria-label={quest.title}>
                    <Quest {quest} />
                </a>
            {/each}
        </div>
    {/if}

    {#if showQuestGraphVisualizer}
        <div class="visualizer-slot">
            <slot name="visualizer" />
        </div>
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

    .custom-heading {
        margin-top: 2rem;
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
