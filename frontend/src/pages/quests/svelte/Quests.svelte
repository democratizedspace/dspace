<script>
    import Quest from './Quest.svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import { onDestroy, onMount, tick } from 'svelte';
    import { listCustomQuestSummaries } from '../../../utils/customcontent.js';
    import {
        loadGameState,
        state as gameStateStore,
        ready,
        getPersistedQuestListSnapshot,
    } from '../../../utils/gameState/common.js';
    import {
        buildClassifierInputFromState,
        classifyQuestList,
        QUEST_LIST_STATUSES,
    } from './questListClassifier.js';
    import {
        markQuestPerf,
        measureQuestPerf,
        QUEST_PERF_MARKS,
        QUEST_PERF_MEASURES,
    } from './questPerformance.js';

    export let quests = [];
    let showQuestGraphVisualizer = false;
    let customQuestRecords = [];
    let builtInClassifiedQuests = [];
    let completedBuiltInQuests = [];
    let customClassifiedQuests = [];
    let builtInSummaries = [];
    let customSummaries = [];
    let unsubscribeState;
    let fullStateReady = false;

    const normalizeQuest = (entry, custom = false) => {
        if (!entry || typeof entry !== 'object') {
            return null;
        }

        const questData = entry.default ?? entry;
        if (!questData?.id) {
            return null;
        }

        return {
            id: String(questData.id),
            title: String(questData.title ?? ''),
            description: String(questData.description ?? ''),
            image: String(questData.image ?? '/assets/quests/howtodoquests.jpg'),
            requiresQuests: Array.isArray(questData.requiresQuests)
                ? questData.requiresQuests.filter(
                      (id) => typeof id === 'string' && id.trim() !== ''
                  )
                : [],
            route:
                typeof questData.route === 'string' ? questData.route : `/quests/${questData.id}`,
            custom,
        };
    };

    const normalizeQuestList = (entries = [], custom = false) => {
        const normalized = [];
        for (const entry of entries ?? []) {
            const prepared = normalizeQuest(entry, custom);
            if (prepared) {
                normalized.push(prepared);
            }
        }
        return normalized;
    };

    const applyClassification = ({ builtInSummaries, customSummaries, classifierInput }) => {
        const builtIn = classifyQuestList(builtInSummaries, classifierInput);
        builtInClassifiedQuests = builtIn.filter((quest) => !quest.isCompleted);
        completedBuiltInQuests = builtIn.filter((quest) => quest.isCompleted);

        customClassifiedQuests = classifyQuestList(customSummaries, {
            ...classifierInput,
            authoritative: Boolean(classifierInput.authoritative),
        });
    };

    const scheduleCustomQuestLoad = async () => {
        const run = async () => {
            try {
                const questsFromStorage = await listCustomQuestSummaries();
                customQuestRecords = Array.isArray(questsFromStorage) ? questsFromStorage : [];
                markQuestPerf(QUEST_PERF_MARKS.CUSTOM_READY);
                measureQuestPerf(
                    QUEST_PERF_MEASURES.CUSTOM_READY,
                    QUEST_PERF_MARKS.HYDRATION_START,
                    QUEST_PERF_MARKS.CUSTOM_READY
                );
            } catch (error) {
                console.error('Unable to load custom quests for listing:', error);
                customQuestRecords = [];
            }
        };

        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(() => {
                run();
            });
            return;
        }

        setTimeout(() => {
            run();
        }, 0);
    };

    onMount(async () => {
        markQuestPerf(QUEST_PERF_MARKS.HYDRATION_START);
        const builtInSummaries = normalizeQuestList(quests);
        const customSummaries = normalizeQuestList(customQuestRecords, true);

        const snapshot = await getPersistedQuestListSnapshot();
        applyClassification({
            builtInSummaries,
            customSummaries,
            classifierInput: {
                authoritative: snapshot.authoritative,
                completedQuestIds: snapshot.completedQuestIds,
                inProgressQuestIds: [],
            },
        });
        markQuestPerf(QUEST_PERF_MARKS.BUILTIN_VISIBLE);
        markQuestPerf(QUEST_PERF_MARKS.SNAPSHOT_READY);
        measureQuestPerf(
            QUEST_PERF_MEASURES.BUILTIN_VISIBLE,
            QUEST_PERF_MARKS.HYDRATION_START,
            QUEST_PERF_MARKS.BUILTIN_VISIBLE
        );
        measureQuestPerf(
            QUEST_PERF_MEASURES.SNAPSHOT_READY,
            QUEST_PERF_MARKS.HYDRATION_START,
            QUEST_PERF_MARKS.SNAPSHOT_READY
        );

        const initialState = loadGameState();
        showQuestGraphVisualizer = Boolean(initialState.settings?.showQuestGraphVisualizer);

        unsubscribeState = gameStateStore.subscribe((value) => {
            showQuestGraphVisualizer = Boolean(value?.settings?.showQuestGraphVisualizer);
        });

        scheduleCustomQuestLoad();

        await ready;
        fullStateReady = true;
        applyClassification({
            builtInSummaries,
            customSummaries: normalizeQuestList(customQuestRecords, true),
            classifierInput: buildClassifierInputFromState(loadGameState()),
        });
        await tick();
        markQuestPerf(QUEST_PERF_MARKS.FULL_RECONCILED);
        measureQuestPerf(
            QUEST_PERF_MEASURES.FULL_RECONCILED,
            QUEST_PERF_MARKS.HYDRATION_START,
            QUEST_PERF_MARKS.FULL_RECONCILED
        );
    });

    onDestroy(() => {
        unsubscribeState?.();
    });

    $: builtInSummaries = normalizeQuestList(quests);
    $: customSummaries = normalizeQuestList(customQuestRecords, true);
    $: if (builtInSummaries.length && fullStateReady) {
        applyClassification({
            builtInSummaries,
            customSummaries,
            classifierInput: buildClassifierInputFromState($gameStateStore),
        });
    }

    const actionButtons = [
        { text: 'Create a new quest', href: '/quests/create' },
        { text: 'Manage quests', href: '/quests/manage' },
    ];
</script>

<div class="container" data-testid="quests-content">
    <div class="action-buttons">
        {#each actionButtons as button}
            <Chip text={button.text} href={button.href} inverted={true} />
        {/each}
    </div>

    <div class="quests-grid" data-testid="quests-grid">
        {#each builtInClassifiedQuests as entry}
            <a href={entry.quest.route} aria-label={entry.quest.title}>
                <Quest quest={entry.quest} status={entry.status} />
            </a>
        {/each}
    </div>

    {#if showQuestGraphVisualizer}
        <div class="visualizer-slot">
            <slot name="visualizer" />
        </div>
    {/if}

    {#if customClassifiedQuests.length > 0}
        <h2>Custom Quests</h2>
        <div class="quests-grid" data-testid="custom-quests-grid">
            {#each customClassifiedQuests as entry}
                <a href={entry.quest.route} aria-label={entry.quest.title}>
                    <Quest quest={entry.quest} status={entry.status} />
                </a>
            {/each}
        </div>
    {/if}

    {#if completedBuiltInQuests.length > 0}
        <h2>Completed Quests</h2>
        {#each completedBuiltInQuests as entry}
            <a href={entry.quest.route} aria-label={entry.quest.title}>
                <Quest quest={entry.quest} compact={true} status={QUEST_LIST_STATUSES.COMPLETED} />
            </a>
        {/each}
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
