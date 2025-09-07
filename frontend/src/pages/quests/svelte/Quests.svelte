<script>
    import Quest from './Quest.svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import { onMount } from 'svelte';
    import { questFinished, canStartQuest } from '../../../utils/gameState.js';
    import { state as gameState, ready } from '../../../utils/gameState/common.js';

    export let quests = [];
    let filteredQuests = [],
        finishedQuests = [];
    let mounted = false;

    onMount(async () => {
        await ready;
        mounted = true;
    });

    $: if (mounted) {
        // Trigger reactivity on game state changes
        const _gs = $gameState;
        filteredQuests = [];
        finishedQuests = [];
        quests.forEach((quest) => {
            const finished = questFinished(quest.id);
            if (finished) {
                finishedQuests.push(quest);
            } else if (canStartQuest(quest)) {
                filteredQuests.push(quest);
            }
        });
    }

    // Define buttons for easy expansion
    const actionButtons = [
        { text: 'Create a new quest', href: '/quests/create' },
        { text: 'Managed quests', href: '/quests/managed' },
    ];
</script>

<div class="container">
    {#if mounted}
        <div class="action-buttons">
            {#each actionButtons as button}
                <Chip text={button.text} href={button.href} inverted={true} />
            {/each}
        </div>

        <div class="quests-grid">
            {#each filteredQuests as quest}
                <a href="/quests/{quest.id}">
                    <Quest {quest} />
                </a>
            {/each}
        </div>

        {#if finishedQuests.length > 0}
            <h2>Completed Quests</h2>
            {#each finishedQuests as quest}
                <a href="/quests/{quest.id}">
                    <Quest {quest} compact={true} />
                </a>
            {/each}
        {/if}
    {/if}
</div>

<style>
    a {
        text-decoration: none;
        margin: 50px;
    }

    .action-buttons {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 20px;
    }

    .quests-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }
</style>
