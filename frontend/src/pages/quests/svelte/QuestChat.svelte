<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import items from '../../inventory/json/items.json';
    import QuestChatOption from './QuestChatOption.svelte';
    import QuestDialoguePreview from './QuestDialoguePreview.svelte';
    import { state, questFinished } from '../../../utils/gameState.js';

    export let quest, pointer, currentDialogue;

    const clientSideRendered = writable(false);
    const finished = writable(false);

    const npc = quest.npc;
    const avatar = localStorage.getItem('avatarUrl');

    // create a map of reward ids (from quest.rewards) to images using the items list
    let rewardItems = quest.rewards.map(reward => {
        let item = items.find(item => item.id === reward.id);
        return {
            id: reward.id,
            count: reward.count,
            image: item.image,
            name: item.name
        }
    });

    pointer = quest.start;

    // map of dialogue ids to dialogue objects
    const dialogueMap = new Map();
    quest.dialogue.forEach(d => {
        dialogueMap.set(d.id, d);
    });

    currentDialogue = dialogueMap.get(pointer);

    onMount(() => {
        clientSideRendered.set(true);
    });

    $: {
        if ($state) {
            if ($state.quests[quest.id]) {
                pointer = $state.quests[quest.id].stepId;
                currentDialogue = dialogueMap.get(pointer);
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
            <h3>{quest.title}</h3>
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
                {#if $clientSideRendered}
                    <div>
                        <img class="banner" src={quest.image} alt={quest.image} />
                    </div>
                    <div class="left">
                        <img src={npc} alt={npc} />
                        <p class="npcDialogue left">
                            {dialogueMap.get(pointer).text}
                        </p>
                    </div>
                    <div class="right options">
                        <img src={avatar} alt={avatar} />
                        {#each dialogueMap.get(pointer).options as option, index}
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
                <a href={`/inventory/item/${item.id}`}><img class="item" src={item.image} alt={item.image} /></a>
                <p>{item.count} x {item.name}</p>
            </div>
        {/each}
    </div>

    <!-- uncomment this line to see a dev preview for debugging purposes -->
    <!-- <QuestDialoguePreview {quest} /> -->
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