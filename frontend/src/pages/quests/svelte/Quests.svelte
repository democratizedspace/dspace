<script>
    import Quest from './Quest.svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import { onDestroy, onMount } from 'svelte';
    import { listCustomQuests } from '../../../utils/customcontent.js';
    import {
        loadGameState,
        state,
        ready,
        getPersistedGameStateLightweightSync,
        getAuthoritativeQuestProgressSnapshot,
    } from '../../../utils/gameState/common.js';
    import { classifyQuestList } from '../../../utils/quests/listClassifier.js';
    import { isBrowser } from '../../../utils/ssr.js';

    export let quests = [];

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

    let builtInQuests = [];
    let builtInClassified = [];
    let completedBuiltInQuests = [];
    let activeBuiltInQuests = [];
    let customQuestRecords = [];
    let customClassified = [];
    let showQuestGraphVisualizer = false;
    let unsubscribeState;

    const normalizeQuest = (questData) => {
        if (!questData || typeof questData !== 'object' || !questData.id) {
            return null;
        }

        const id = String(questData.id).trim();
        if (!id) {
            return null;
        }

        const requiresQuests = Array.isArray(questData.requiresQuests)
            ? questData.requiresQuests.filter(
                  (questId) => typeof questId === 'string' && questId.trim()
              )
            : [];

        return {
            id,
            title: typeof questData.title === 'string' ? questData.title : id,
            description: typeof questData.description === 'string' ? questData.description : '',
            image: typeof questData.image === 'string' ? questData.image : '',
            requiresQuests,
            route: typeof questData.route === 'string' ? questData.route : `/quests/${id}`,
        };
    };

    const normalizeQuestList = (entries = []) => entries.map(normalizeQuest).filter(Boolean);

    const applyBuiltInClassification = (snapshot) => {
        builtInClassified = classifyQuestList({
            quests: builtInQuests,
            snapshot,
        });

        completedBuiltInQuests = builtInClassified.filter((quest) => quest.status === 'completed');
        activeBuiltInQuests = builtInClassified.filter((quest) => quest.status !== 'completed');
    };

    const classifyCustomQuests = (snapshot) => {
        const normalizedCustomQuests = normalizeQuestList(customQuestRecords);
        customClassified = classifyQuestList({ quests: normalizedCustomQuests, snapshot });
    };

    // Define buttons for easy expansion
    const actionButtons = [
        { text: 'Create a new quest', href: '/quests/create' },
        { text: 'Manage quests', href: '/quests/manage' },
    ];

    $: builtInQuests = normalizeQuestList(quests);
    $: if (builtInQuests.length > 0) {
        applyBuiltInClassification({ authoritative: false, completedQuestIds: [] });
    }

    onMount(async () => {
        markPerf('quests:list-hydration-start');

        const lightweightSnapshot = getPersistedGameStateLightweightSync();
        const trustedSnapshot = getAuthoritativeQuestProgressSnapshot(lightweightSnapshot);

        applyBuiltInClassification(trustedSnapshot);
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

        await ready;
        const currentState = loadGameState();
        showQuestGraphVisualizer = Boolean(currentState.settings?.showQuestGraphVisualizer);

        const fullStateSnapshot = { state: currentState };
        applyBuiltInClassification(fullStateSnapshot);

        unsubscribeState = state.subscribe((value) => {
            showQuestGraphVisualizer = Boolean(value?.settings?.showQuestGraphVisualizer);
            applyBuiltInClassification({ state: value });
            classifyCustomQuests({ state: value });
        });

        markPerf('quests:full-state-reconciliation-complete');
        measurePerf(
            'quests:time-to-full-reconciliation',
            'quests:list-hydration-start',
            'quests:full-state-reconciliation-complete'
        );

        try {
            const questsFromStorage = await listCustomQuests();
            customQuestRecords = Array.isArray(questsFromStorage) ? questsFromStorage : [];
        } catch (error) {
            console.error('Unable to load custom quests for listing:', error);
            customQuestRecords = [];
        }

        classifyCustomQuests({ state: loadGameState() });
        markPerf('quests:custom-quests-merge-complete');
        measurePerf(
            'quests:time-to-custom-merge',
            'quests:list-hydration-start',
            'quests:custom-quests-merge-complete'
        );
    });

    onDestroy(() => {
        unsubscribeState?.();
    });
</script>

<div class="container">
    <div class="action-buttons">
        {#each actionButtons as button}
            <Chip text={button.text} href={button.href} inverted={true} />
        {/each}
    </div>

    <div class="quests-grid" data-testid="quests-grid">
        {#each activeBuiltInQuests as quest}
            <a href={quest.route} aria-label={quest.title}>
                <Quest {quest} status={quest.status} />
            </a>
        {/each}
    </div>

    {#if showQuestGraphVisualizer}
        <div class="visualizer-slot">
            <slot name="visualizer" />
        </div>
    {/if}

    <section class="custom-section" data-testid="custom-quests-section">
        {#if customClassified.length > 0}
            <h2>Custom Quests</h2>
            <div class="quests-grid">
                {#each customClassified as quest}
                    <a href={quest.route} aria-label={quest.title}>
                        <Quest {quest} status={quest.status} />
                    </a>
                {/each}
            </div>
        {/if}
    </section>

    {#if completedBuiltInQuests.length > 0}
        <h2>Completed Quests</h2>
        {#each completedBuiltInQuests as quest}
            <a href={quest.route} aria-label={quest.title}>
                <Quest {quest} compact={true} status={quest.status} />
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

    .custom-section {
        min-height: 12px;
    }
</style>
