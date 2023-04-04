<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import items from '../../inventory/json/items.json';
    import Chip from '../../../components/svelte/Chip.svelte';
    import Process from '../../../components/svelte/Process.svelte';
    import {
        finishQuest,
        getItemCounts,
        startProcess,
        setCurrentDialogueStep,
        getCurrentDialogueStep,
        getItemsGranted,
        grantItems,
    } from '../../../utils/gameState.js';
    import CompactItemList from '../../../components/svelte/CompactItemList.svelte';

    export let quests, quest, pointer, currentDialogue, finished;
    
    const requirementsCheckStatus = writable({});
    const clientSideRendered = writable(false);

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
        if (option.type === "process") {
            return;
        }

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
            case "grantsItems": {
                console.log("grantsItems");
                grantItems(quest.id, pointer, option.grantsItems);
                console.log("granted items");
                updateRequirementsCheckStatus();
                return;
            }
            case "process": {
                const process = 
                startProcess(option.startProcess, );
                return;
            }
            case "goto": {
                pointer = option.goto;
                currentDialogue = dialogueMap.get(pointer);
                setCurrentDialogueStep(quest.id, pointer);
                break;
            }
        }

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

    function getItemQuantity(item) {
        const itemCount = getItemCounts([item]);
        return `${itemCount[item.id]}/${item.count}`
    }

    function updateRequirementsCheckStatus() {
        const optionRequirementsMet = {};

        dialogueMap.get(pointer).options.forEach((option, index) => {
            console.log(`option: ${JSON.stringify(option)}`);
            console.log(`index: ${index}`);
            if (option.requiresItems) {
                optionRequirementsMet[index] = itemRequirementsMet(option.requiresItems);
            } else if (option.grantsItems) {
                console.log("checking to make sure the items haven't already been granted");
                if (getItemsGranted(quest.id, pointer)) {
                    console.log("items have already been granted");
                    optionRequirementsMet[index] = false;
                } else {
                    optionRequirementsMet[index] = true;
                }
            } else {
                optionRequirementsMet[index] = true;
            }
        });

        requirementsCheckStatus.set(optionRequirementsMet);
    }

    const currentDialogueStep = getCurrentDialogueStep(quest.id);
    console.log("currentDialogueStep: " + currentDialogueStep);
    if (currentDialogueStep) {
        pointer = currentDialogueStep;
        currentDialogue = dialogueMap.get(pointer);
    }
    
    updateRequirementsCheckStatus();

    onMount(() => {
        clientSideRendered.set(true);
    });
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
            <div class="option">
                {#if option.type === "grantsItems"}
                    {#if !$requirementsCheckStatus[index]}
                        <Chip text={option.text} disabled={true}>
                            <CompactItemList itemList={option.grantsItems} disabled={true} />
                        </Chip>
                    {:else}
                        <Chip text={option.text} onClick={() => onOptionClick(option)}>
                            <CompactItemList itemList={option.grantsItems} increase={true} />
                        </Chip>
                    {/if}
                {:else if option.requiresItems}
                    {#if $requirementsCheckStatus[index]}
                        <Chip text={option.text} onClick={() => onOptionClick(option)}>
                            <div class="vertical">
                                <p>Requires:</p>
                                <CompactItemList itemList={option.requiresItems} />
                            </div>
                        </Chip>
                    {:else}
                        <Chip text={option.text} disabled={true}>
                            <div class="vertical">
                                <p>Requires:</p>
                                <CompactItemList itemList={option.requiresItems} disabled={true} />
                            </div>
                        </Chip>
                    {/if}
                {:else if option.type === "process"}
                <Chip text={option.text} onClick={() => onOptionClick(option)}>
                <div class="vertical">
                    <Process processId={option.process} />
                </div>
                </Chip>
                {:else}
                    <Chip text={option.text} onClick={() => onOptionClick(option)}></Chip>
                {/if}
            </div>
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
        width: 70%;
    }

    .temp-container {
        height: 50vh;
    }

    img {
        width: 50px;
        height: 50px;
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

    .tiny {
        width: 20px;
        height: 20px;
        border-radius: 20px;
        /* green border */
        border: 2px solid #68d46d;
    }
</style>