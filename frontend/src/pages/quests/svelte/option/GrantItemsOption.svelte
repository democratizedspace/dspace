<script>
    import { writable } from 'svelte/store';
    import Chip from '../../../../components/svelte/Chip.svelte';
    import CompactItemList from '../../../../components/svelte/CompactItemList.svelte';
    import { state, grantItems, getItemsGranted } from '../../../../utils/gameState.js';
    
    export let option, questId, stepId, optionIndex;

    const itemsClaimed = writable(false);

    function onClick() {
        grantItems(questId, stepId, optionIndex, option.grantsItems); 
    }

    $: {
        if ($state) {
            if (getItemsGranted(questId, stepId, optionIndex)) {
                itemsClaimed.set(true);
            }
        }
    }
</script>

<div>
    {#if $state}
        <Chip disabled={$itemsClaimed} text={option.text}>
            <div class="vertical container">
                <CompactItemList disabled={$itemsClaimed} itemList={option.grantsItems} increase={true} />
                <Chip disabled={$itemsClaimed} inverted={true} text="Claim" onClick={() => onClick()} />
            </div>
        </Chip>
    {/if}
</div>

<style>
    .container {
        margin-bottom: 10px;
    }

    .vertical {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 10px;
    }
</style>