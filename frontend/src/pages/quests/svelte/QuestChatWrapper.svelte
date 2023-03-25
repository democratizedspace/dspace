<script>
    import { writable } from 'svelte/store';
    import items from '../../inventory/json/items.json';
    import processes from '../../processes/processes.json';
    import Chip from '../../../components/svelte/Chip.svelte';
    import { finishQuest, addItems, getItemCounts, startProcess } from '../../../utils/gameState.js';

    export let quests, quest, pointer, currentDialogue, finished;
    
    const requirementsCheckStatus = writable({});

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

    // FUNCTIONS

    function onOptionClick(option) {

        console.log(`option: ${option.text}`);
        switch (option.type) {
            case "finish": {
                finishQuest(quest.id);

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
            case "grantItems": {
                console.log("grantItems");
                addItems(option.grantItems);
                updateRequirementsCheckStatus();
                return;
            }
            case "process": {
                const process = 
                startProcess(option.startProcess, );
                return;
            }
        }

        pointer = option.goto;
        currentDialogue = dialogueMap.get(pointer);
        updateRequirementsCheckStatus();
    }

    function prettyPrintItemList(itemList) {
        console.log(`pretty print items: ${JSON.stringify(itemList)}}`);
        let result = "";
        itemList.forEach(item => {
            const i = items.find(i => i.id === item.id);
            console.log(`i: ${JSON.stringify(i)}`);
            result += `${item.count} x ${i.name}, `;
        });
        return result.substring(0, result.length - 2);
    }

    function itemRequirementsMet(itemList) {
        let requirementsMet = true;
        const actualItemCounts = getItemCounts(itemList);

        itemList.forEach(requiredItem => {
            console.log(`left: ${actualItemCounts[requiredItem.id]}, right: ${requiredItem.count}`);
            if (actualItemCounts[requiredItem.id] < requiredItem.count) {
                requirementsMet = false;
            }
        });
        return requirementsMet;
    }

    function updateRequirementsCheckStatus() {
        const optionRequirementsMet = {};

        dialogueMap.get(pointer).options.forEach((option, index) => {
            if (option.requiresItems) {
                optionRequirementsMet[index] = itemRequirementsMet(option.requiresItems);
            } else {
                optionRequirementsMet[index] = true;
            }
        });

        requirementsCheckStatus.set(optionRequirementsMet);
    }

    updateRequirementsCheckStatus();
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
            <div>
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
                        <div class="option">
                        {#if option.type === "grantItems"}
                            <Chip text={`${option.text} (grants: ${prettyPrintItemList(option.grantItems)})`} onClick={() => onOptionClick(option)}></Chip>
                        {:else if option.requiresItems}
                            {#if $requirementsCheckStatus[index]}
                            <Chip text={`${option.text} (requires: ${prettyPrintItemList(option.requiresItems)})`} onClick={() => onOptionClick(option)}></Chip>
                            {:else}
                            <Chip text={`${option.text} (requires: ${prettyPrintItemList(option.requiresItems)})`} disabled={true}></Chip>
                            {/if}
                        {:else if option.type === "process"}
                            <Chip text={option.text} onClick={() => onOptionClick(option)}>
                                <div class="vertical">
                                    <Chip text="Start" inverted={true} onClick={() => onOptionClick(option)}></Chip>
                                </div>
                            </Chip>
                        {:else}
                            <Chip text={option.text} onClick={() => onOptionClick(option)}></Chip>
                        {/if}
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
    </div>
    <div class="vertical">
        <h5>Status:</h5>
        {#if finished}
            <p class="green">Complete</p>
        {:else}
            <p class="orange">In Progress</p>
        {/if}
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
        padding: 30px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin-top: 30px;
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

    /* mobile */
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

    .option {
        margin: 5px;
    }

    .options > img {
        margin: 5px;
    }
</style>