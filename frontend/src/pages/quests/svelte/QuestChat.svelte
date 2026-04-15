<script>
    import { onDestroy, onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import QuestChatOption from './QuestChatOption.svelte';
    import { getUnmetQuestRequirements, questFinished } from '../../../utils/gameState.js';
    import {
        isGameStateReady,
        ready,
        state,
        syncGameStateFromLocalIfStale,
    } from '../../../utils/gameState/common.js';
    import { isBrowser } from '../../../utils/ssr.js';
    import { getItemMap } from '../../../utils/itemResolver.js';
    import { formatDialogue } from '../../../utils/formatDialogue.ts';
    import QuestLinkChips from '../../../components/svelte/QuestLinkChips.svelte';

    export let quest;
    export let pointer;
    export let currentDialogue;

    const clientSideRendered = writable(false);
    const finished = writable(false);
    const available = writable(null);

    let unmetRequirements = [];

    // Move these declarations inside onMount to ensure quest is defined
    let npc;
    let rewardItems = [];
    let dialogueMap;
    let rewardRequestId = 0;
    let rewardItemsKey = '';
    let isMounted = false;
    let refreshIntervalId;
    let gameStateReady = false;

    const releaseRewardImages = (items) => {
        items.forEach((item) => item?.releaseImage?.());
    };

    const loadRewardItems = async () => {
        const rewards = quest?.rewards ?? [];
        const ids = rewards.map((reward) => reward?.id);
        const requestId = ++rewardRequestId;
        const itemMap = await getItemMap(ids);

        if (!isMounted || requestId !== rewardRequestId) {
            releaseRewardImages(Array.from(itemMap.values()));
            return;
        }

        releaseRewardImages(rewardItems);
        rewardItems = rewards
            .map((reward) => {
                const rewardId =
                    typeof reward?.id === 'string' || typeof reward?.id === 'number'
                        ? String(reward.id)
                        : null;
                if (!rewardId) {
                    return null;
                }
                const item = itemMap.get(rewardId);
                return {
                    id: reward.id,
                    count: reward.count,
                    image: item?.image ?? '/favicon.ico',
                    name: item?.name ?? 'Unknown item',
                    releaseImage: item?.releaseImage ?? null,
                };
            })
            .filter(Boolean);
    };

    // Only access localStorage in browser environment to avoid SSR errors
    const avatar =
        (isBrowser ? localStorage.getItem('avatarUrl') : null) ||
        '/assets/pfp/7ecc9e2a-dd79-4bf8-87b5-57f090dd8c14.jpg';

    onMount(() => {
        refreshIntervalId = setInterval(() => {
            syncGameStateFromLocalIfStale();
        }, 3000);
        gameStateReady = isGameStateReady();
        if (!gameStateReady) {
            void ready.then(() => {
                if (!isMounted) {
                    return;
                }
                gameStateReady = true;
            });
        }
        rewardItemsKey = (quest?.rewards ?? []).map((reward) => reward?.id ?? '').join('|');
        isMounted = true;
        // Initialize quest-related data after component is mounted
        if (quest) {
            npc = quest.npc;

            // Initialize pointer if not set
            pointer = pointer || quest.start;

            // Create dialogue map
            dialogueMap = new Map();
            quest.dialogue.forEach((d) => {
                dialogueMap.set(d.id, d);
            });

            currentDialogue = dialogueMap.get(pointer);
        }

        clientSideRendered.set(true);
        void loadRewardItems();
    });

    onDestroy(() => {
        clearInterval(refreshIntervalId);
        releaseRewardImages(rewardItems);
    });

    $: {
        if (gameStateReady && $state && quest) {
            unmetRequirements = getUnmetQuestRequirements(quest);
            available.set(!questFinished(quest.id) && unmetRequirements.length === 0);
            if ($state.quests[quest.id]) {
                pointer = $state.quests[quest.id].stepId;
                currentDialogue = dialogueMap?.get(pointer);
            }
            finished.set(questFinished(quest.id));
        }
    }

    $: if (isMounted) {
        const nextKey = (quest?.rewards ?? []).map((reward) => reward?.id ?? '').join('|');
        if (nextKey !== rewardItemsKey) {
            rewardItemsKey = nextKey;
            void loadRewardItems();
        }
    }
</script>

<div class="vertical">
    <div class="horizontal">
        <div class="vertical">
            <h3>{quest?.title}</h3>
        </div>
    </div>
    {#if !gameStateReady}
        <div class="chat" data-testid="chat-panel">
            <div class="chat-body">
                <div class="temp-container"></div>
            </div>
        </div>
    {:else if $finished}
        <div class="chat" data-testid="chat-panel">
            <div class="vertical">
                <h4>Quest Complete!</h4>
                <p>
                    You have completed this quest. You can now return to the Quests page to start
                    another quest.
                </p>
            </div>
        </div>
    {:else if $available === false}
        <div class="chat" data-testid="chat-panel">
            <div class="vertical unavailable-content" data-testid="quest-unavailable">
                <h4>Quest not available yet</h4>
                <p>Complete these quests first:</p>
                <QuestLinkChips questIds={unmetRequirements} />
            </div>
        </div>
    {:else}
        <div class="chat" data-testid="chat-panel">
            <div class="chat-body">
                {#if $clientSideRendered && quest && dialogueMap}
                    <div class="quest-banner">
                        <img class="banner" src={quest.image} alt={quest.title} />
                    </div>
                    <div class="left">
                        <img src={npc} alt="NPC" />
                        <div class="npcDialogue left">
                            {@html formatDialogue(dialogueMap.get(pointer)?.text)}
                        </div>
                    </div>
                    <div class="right options">
                        <img src={avatar} alt="Avatar" />
                        {#each dialogueMap.get(pointer)?.options || [] as option, index}
                            <QuestChatOption
                                {quest}
                                {option}
                                questId={quest.id}
                                stepId={pointer}
                                optionIndex={index}
                            />
                        {/each}
                    </div>
                {:else}
                    <div class="temp-container"></div>
                {/if}
            </div>
        </div>
    {/if}
    <div class="vertical">
        <h5>Status:</h5>
        {#if !gameStateReady}
            <p class="orange">Loading...</p>
        {:else if $finished}
            <p class="green">Complete</p>
        {:else if $available === false}
            <p>Not available yet</p>
        {:else}
            <p class="orange">In Progress</p>
        {/if}
        <h5>Rewards:</h5>
        {#each rewardItems as item}
            <div class="horizontal">
                <a href={`/inventory/item/${item.id}`}
                    ><img class="item" src={item.image} alt={item.name} /></a
                >
                <p>{item.count} x {item.name}</p>
            </div>
        {/each}
    </div>
</div>

<style>
    .chat {
        background-color: #68d46d;
        color: black;
        border-radius: 20px;
        padding: 30px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin-top: 30px;
        width: 70%;
    }

    .temp-container {
        height: 50vh;
    }

    .unavailable-content {
        width: 100%;
    }

    img {
        width: 50px;
        height: 50px;
        border-radius: 20px;
        border: 2px solid #68d46d;
    }

    .item {
        width: 50px;
        height: 50px;
        border-radius: 20px;
        border: 2px solid #68d46d;
        margin: 5px;
    }

    .npcDialogue {
        background-color: #a4f1b1;
        color: black;
        padding: 10px;
        border-radius: 20px;
        text-align: left;
        opacity: 0.9;
        border: 1px solid #24cf2f;
        width: 80%;
        margin-top: 10px;
    }

    .npcDialogue:hover {
        opacity: 1;
    }

    .npcDialogue :global(code) {
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 0.95em;
        background: rgba(36, 207, 47, 0.2);
        padding: 2px 6px;
        border-radius: 8px;
        border: 1px solid rgba(36, 207, 47, 0.35);
    }

    .quest-banner {
        width: min(512px, 100%);
        aspect-ratio: 1 / 1;
        margin: 0 auto 24px;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        box-sizing: border-box;
    }

    .banner {
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        object-fit: cover;
        display: block;
        margin: 0;
        border-radius: 0;
        border: none;
    }

    .chat-body {
        width: 100%;
    }

    .left {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
    }

    .right {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-end;
    }

    .vertical {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
    }

    .horizontal {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .options > img {
        margin: 5px;
    }
</style>
