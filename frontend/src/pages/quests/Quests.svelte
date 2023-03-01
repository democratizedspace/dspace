<script>
    import Chip from '../../components/svelte/Chip.svelte';

    export let quests = [];
    let questMap = quests.reduce((map, quest) => {
        map[quest.id] = quest;
        return map;
    }, {});
    let startingDialogue = {};
    let dialogue = {};

    import { onMount } from 'svelte';

    onMount(() => {
        quests.forEach(quest => {
            startingDialogue[quest.id] = quest.start;
            dialogue[quest.id] = quest.dialogue.find(d => d.id === quest.start);
        });
    });

    function appendDialogue(questId, dialogueId) {
        console.log("questId", questId);
        console.log("dialogueId", dialogueId);
        const quest = questMap[questId];
        console.log("quest", quest);
        const nextDialogue = quest.dialogue.find(d => d.id === dialogueId);
        console.log("nextDialogue", nextDialogue);
        dialogue[questId] = nextDialogue;
        console.log("dialogue", dialogue);
    }

    function dismissQuest(questId) {
        // replace quests[questId] with a new object that has dismissed: true
        const index = quests.findIndex(q => q.id === questId);
        quests[index] = {
            ...quests[index],
            dismissed: true
        };
    }
</script>

<div class="container">
    <h3>Up Next</h3>

    {#each quests as quest}
        {#if !quest.dismissed}
            <div class="quest">
                <h4>{quest.title}</h4>
                {#if dialogue[quest.id]}
                    <p>{dialogue[quest.id].text}</p>
                    {#each dialogue[quest.id].options as option}
                        {#if option.type === 'goto'}
                            <div on:click={appendDialogue(quest.id, option.goto)}>
                                <Chip text={option.text} />
                            </div>
                        {:else if option.type === 'dismiss'}
                            <div on:click={dismissQuest(quest.id)}>
                                <Chip text={option.text} />
                            </div>
                        {/if}
                    {/each}
                {/if}
            </div>
        {/if}
    {/each}
</div>