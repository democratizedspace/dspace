<script>
    import Quest from './Quest.svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import { onDestroy, onMount, tick } from 'svelte';
    import {
        loadGameState,
        state,
        ready,
        getPersistedGameStateLightweight,
        isAuthoritativeQuestSnapshot,
    } from '../../../utils/gameState/common.js';
    import { listCustomQuests } from '../../../utils/customcontent.js';
    import { classifyQuestList } from '../../../utils/quests/listClassifier.js';

    export let quests = [];

    let builtInClassifiedQuests = [];
    let customClassifiedQuests = [];
    let showQuestGraphVisualizer = false;
    let unsubscribeState;

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

        return {
            id: questData.id,
            title: questData.title,
            description: questData.description,
            image: questData.image,
            route: questData.route ?? `/quests/${questData.id}`,
            requiresQuests,
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

    const mark = (name) => {
        if (typeof performance?.mark === 'function') {
            performance.mark(name);
        }
    };

    const measure = (name, startMark, endMark) => {
        if (typeof performance?.measure === 'function') {
            performance.measure(name, startMark, endMark);
        }
    };

    const initialBuiltIns = normalizeQuestList(quests);
    builtInClassifiedQuests = classifyQuestList({ quests: initialBuiltIns });

    onMount(async () => {
        mark('quests:route-hydration-start');

        await tick();
        mark('quests:builtins-visible');
        measure('quests:time-to-builtins-visible', 'quests:route-hydration-start', 'quests:builtins-visible');

        const snapshot = await getPersistedGameStateLightweight();
        const snapshotForClassification = {
            ...snapshot,
            isAuthoritative: isAuthoritativeQuestSnapshot(snapshot),
        };
        builtInClassifiedQuests = classifyQuestList({
            quests: initialBuiltIns,
            snapshot: snapshotForClassification,
        });
        mark('quests:snapshot-classification-ready');
        measure(
            'quests:time-to-snapshot-classification',
            'quests:route-hydration-start',
            'quests:snapshot-classification-ready'
        );

        const customQuestPromise = listCustomQuests()
            .then((records) => {
                const normalizedCustomQuests = normalizeQuestList(
                    Array.isArray(records) ? records : []
                );
                customClassifiedQuests = classifyQuestList({
                    quests: normalizedCustomQuests,
                    snapshot: snapshotForClassification,
                });
                mark('quests:custom-merge-complete');
                measure(
                    'quests:time-to-custom-merge',
                    'quests:route-hydration-start',
                    'quests:custom-merge-complete'
                );
            })
            .catch((error) => {
                console.error('Unable to load custom quests for listing:', error);
                customClassifiedQuests = [];
            });

        await ready;
        const fullState = loadGameState();
        builtInClassifiedQuests = classifyQuestList({ quests: initialBuiltIns, fullState });
        customClassifiedQuests = classifyQuestList({
            quests: customClassifiedQuests,
            fullState,
        });
        showQuestGraphVisualizer = Boolean(fullState.settings?.showQuestGraphVisualizer);

        unsubscribeState = state.subscribe((value) => {
            showQuestGraphVisualizer = Boolean(value?.settings?.showQuestGraphVisualizer);
        });

        mark('quests:fullstate-reconciliation-complete');
        measure(
            'quests:time-to-fullstate-reconciliation',
            'quests:route-hydration-start',
            'quests:fullstate-reconciliation-complete'
        );

        await customQuestPromise;
    });

    onDestroy(() => {
        unsubscribeState?.();
    });

    // Define buttons for easy expansion
    const actionButtons = [
        { text: 'Create a new quest', href: '/quests/create' },
        { text: 'Manage quests', href: '/quests/manage' },
    ];
</script>

<div class="container" data-testid="quests-container">
    <div class="action-buttons">
        {#each actionButtons as button}
            <Chip text={button.text} href={button.href} inverted={true} />
        {/each}
    </div>

    <div class="quests-grid" data-testid="quests-grid">
        {#each builtInClassifiedQuests as quest}
            <a href={quest.route} aria-label={quest.title}>
                <Quest {quest} status={quest.status} />
            </a>
        {/each}
    </div>

    {#if customClassifiedQuests.length > 0}
        <section class="custom-quests" data-testid="custom-quests-section">
            <h2>Custom Quests</h2>
            <div class="quests-grid">
                {#each customClassifiedQuests as quest}
                    <a href={quest.route} aria-label={quest.title}>
                        <Quest {quest} status={quest.status} />
                    </a>
                {/each}
            </div>
        </section>
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

    .custom-quests {
        margin-top: 24px;
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
