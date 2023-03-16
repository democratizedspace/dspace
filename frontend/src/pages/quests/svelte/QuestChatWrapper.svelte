<script>
    import items from '../../inventory/json/items.json';
    import Chip from '../../../components/svelte/Chip.svelte';

    export let quest, pointer, currentDialogue, finished;

    const npc = quest.npc;
    console.log("npc: " + npc);
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

    function onOptionClick(option) {

        if (option.type === "dismiss") {
            window.location.pathname = '/quests';
            return;
        }

        if (option.type === "finish") {
            localStorage.setItem(`quest-${quest.id}-finished`, true);

            // add rewards to inventory
            rewardItems.forEach(item => {
                let inventoryItem = JSON.parse(localStorage.getItem(`inventory-${item.id}`));
                if (inventoryItem) {
                    inventoryItem.count += item.count;
                    localStorage.setItem(`inventory-${item.id}`, JSON.stringify(inventoryItem));
                } else {
                    localStorage.setItem(`inventory-${item.id}`, JSON.stringify(item));
                }
            });

            window.location.pathname = `/quests/${quest.id}/finished`;

            return;
        }

        pointer = option.goto;
        currentDialogue = dialogueMap.get(pointer);
    }
    
</script>

<div class="vertical">
    <div class="horizontal">
        <div class="vertical">
            <h3>{quest.title}</h3>
        </div>
    </div>
    {#if finished}
        <div class="chat">
            <div class="vertical">
                <h4>Quest Complete!</h4>
                <p>You have completed this quest. You can now return to the Quests page to start another quest.</p>
            </div>
        </div>
    {:else}
        <div class="chat">
            <div class="vertical">
                <div>
                    <img class="banner" src={quest.image} alt={quest.image} />
                </div>

                <div class="left">
                    <div class="vertical">
                        <div class="left">
                            <img src={npc} alt={npc} />
                        </div>
                        <p class="npcDialogue">
                            {dialogueMap.get(pointer).text}
                        </p>
                    </div>
                </div>
                <div class="right">
                    <img src={avatar} alt={avatar} />
                    {#each dialogueMap.get(pointer).options as option}
                        <div class="right option">
                            <Chip text={option.text} onClick={() => onOptionClick(option)}>{option.text}</Chip>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
    </div>
    <div class="vertical">
        <h5>Status:</h5>
        <p class="green">Complete</p>
        <h5>Rewards:</h5>
        {#each rewardItems as item}
            <div class="horizontal">
                <img class="item" src={item.image} alt={item.image} />
                <p>{item.count} x {item.name}</p>
            </div>
        {/each}
    </div>

<style>
    .chat {
        /* background-color: a dark mode chat background color */
        background-color: #68d46d;
        color: black;
        border-radius: 20px;
        padding: 10px;
    }

    img {
        width: 100px;
        height: 100px;
        border-radius: 20px;
        /* green border */
        border: 2px solid #68d46d;
    }

    .item {
        width: 50px;
        height: 50px;
        border-radius: 20px;
        /* green border */
        border: 2px solid #68d46d;
        margin: 5px;
    }

    .horizontal {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .vertical {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .orange {
        color: orange;
    }

    .left {
        background-color: #68d46d;
        border-radius: 20px;
        text-align: left;
        margin-top: 25px;
    }

    .right {
        background-color: #68d46d;
        color: black;
        border-radius: 20px;
        padding: 5px;
        margin-right: -30%;
        text-align: right;
    }

    .npcDialogue {
        background-color: #545854;
        margin: 20px;
        color: white;
        padding: 10px;
        border-radius: 20px;
        text-align: left;
        opacity: 0.9;
        border: 2px solid #29472b;
    }

    .npcDialogue:hover {
        opacity: 1;
    }

    .banner {
        width: 200px;
        height: 200px;
        margin-top: -15px;
    }

    .option {
        max-width: 100%;
    }

    .green {
        color: white;
        background-color: green;
        padding: 30px;
        border-radius: 20px;
    }
</style>