<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import items from '../../inventory/json/items.json';
    import QuestChatOption from './QuestChatOption.svelte';
    import { questFinished } from '../../../utils/gameState.js';
    import { state } from '../../../utils/gameState/common.js';

    export let quest;
    export let pointer;
    export let currentDialogue;

    const clientSideRendered = writable(false);
    const finished = writable(false);

    // Move these declarations inside onMount to ensure quest is defined
    let npc;
    let rewardItems = [];
    let dialogueMap;

    const avatar = localStorage.getItem('avatarUrl') || '/assets/pfp/7ecc9e2a-dd79-4bf8-87b5-57f090dd8c14.jpg';

    onMount(() => {
        // Initialize quest-related data after component is mounted
        if (quest) {
            npc = quest.npc;
            
            // Create reward items map
            rewardItems = quest.rewards.map(reward => {
                let item = items.find(item => item.id === reward.id);
                return {
                    id: reward.id,
                    count: reward.count,
                    image: item.image,
                    name: item.name
                }
            });

            // Initialize pointer if not set
            pointer = pointer || quest.start;

            // Create dialogue map
            dialogueMap = new Map();
            quest.dialogue.forEach(d => {
                dialogueMap.set(d.id, d);
            });

            currentDialogue = dialogueMap.get(pointer);
        }
        
        clientSideRendered.set(true);
    });

    $: {
        if ($state && quest) {
            if ($state.quests[quest.id]) {
                pointer = $state.quests[quest.id].stepId;
                currentDialogue = dialogueMap?.get(pointer);
            }
            if (questFinished(quest.id)) {
                finished.set(true);
            }
        }
    }
</script>

<div class="vertical">
    <div class="horizontal">
        <div class="vertical">
            <h3>{quest?.title}</h3>
        </div>
    </div>
    {#if $finished}
        <div class="chat">
            <div class="vertical">
                <h4>Quest Complete!</h4>
                <p>You have completed this quest. You can now return to the Quests page to start another quest.</p>
            </div>
        </div>
    {:else}
        <div class="chat">
            <div>
                {#if $clientSideRendered && quest && dialogueMap}
                    <div>
                        <img class="banner" src={quest.image} alt={quest.title} />
                    </div>
                    <div class="left">
                        <img src={npc} alt="NPC" />
                        <p class="npcDialogue left">
                            {dialogueMap.get(pointer)?.text}
                        </p>
                    </div>
                    <div class="right options">
                        <img src={avatar} alt="Avatar" />
                        {#each dialogueMap.get(pointer)?.options || [] as option, index}
                            <QuestChatOption {quest} {option} questId={quest.id} stepId={pointer} optionIndex={index} />
                        {/each}
                    </div>
                {:else}
                    <div class="temp-container" />
                {/if}
            </div>
        </div>
    {/if}
    <div class="vertical">
        <h5>Status:</h5>
        {#if $finished}
            <p class="green">Complete</p>
        {:else}
            <p class="orange">In Progress</p>
        {/if}
        <h5>Rewards:</h5>
        {#each rewardItems as item}
            <div class="horizontal">
                <a href={`/inventory/item/${item.id}`}><img class="item" src={item.image} alt={item.name} /></a>
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

    .banner {
        width: 120%;
        height: 300px;
        object-fit: cover;
        margin-left: -10%;
        margin-top: -10%;
    }

    @media only screen and (max-width: 600px) {
        .banner {
            width: 120%;
            margin: -10%;
            margin-bottom: 0px;
        }
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