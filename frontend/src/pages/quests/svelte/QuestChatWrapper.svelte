<script>
    import QuestChat from './QuestChat.svelte';
    import items from '../../inventory/json/items.json';
    import Chip from '../../../components/svelte/Chip.svelte';

    export let quest, pointer, currentDialogue;

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
    <div class="chat">
        <div class="vertical">
            <div>
                <img class="banner" src={quest.image} alt={quest.image} />
            </div>
            <QuestChat quest={quest} />
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
            </div>
            {#each dialogueMap.get(pointer).options as option}
                <div class="right">
                    <Chip text={option.text} onClick={() => onOptionClick(option)}>{option.text}</Chip>
                </div>
            {/each}
        </div>
    </div>
    <h5>Status:</h5>
    <p class="orange">In Progress</p>
    <h5>Rewards:</h5>
    <div class="vertical">
        {#each rewardItems as item}
            <div class="horizontal">
                <img src={item.image} alt={item.image} />
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
        padding: 20px;
    }

    img {
        width: 40px;
        height: 40px;
        border-radius: 20px;
        /* green border */
        border: 2px solid #68d46d;
        margin: 10px;
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
        margin-left: -10%;
        width: 90%;
        text-align: left;
        margin-top: 25px;
    }

    .right {
        background-color: #68d46d;
        color: black;
        border-radius: 20px;
        padding: 5px;
        margin-right: -30%;
        width: 70%;
        text-align: right;
    }

    .npcDialogue {
        background-color: #004603;
        /* background-color to a complimentary color of above */

        color: white;
        padding: 10px;
        border-radius: 20px;
        margin-left: -30%;
        width: 66%;
        text-align: left;
        opacity: 0.8;
    }

    .banner {
        width: 110%;
        height: auto;
        margin: -5%;
    }
</style>