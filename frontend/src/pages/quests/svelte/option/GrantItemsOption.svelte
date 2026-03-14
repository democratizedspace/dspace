<script>
    import { writable } from 'svelte/store';
    import Chip from '../../../../components/svelte/Chip.svelte';
    import CompactItemList from '../../../../components/svelte/CompactItemList.svelte';
    import { grantItems, getItemsGranted } from '../../../../utils/gameState.js';
    import { state } from '../../../../utils/gameState/common.js';

    export let option, questId, stepId, optionIndex;

    const itemsClaimed = writable(false);

    function onClick() {
        grantItems(questId, stepId, optionIndex, option.grantsItems);
    }

    $: {
        if ($state) {
            if (getItemsGranted(questId, stepId, optionIndex)) {
                itemsClaimed.set(true);
            } else {
                itemsClaimed.set(false);
            }
        }
    }
</script>

<div>
    {#if $state}
        <Chip disabled={$itemsClaimed} text="">
            <div class="vertical container">
                <CompactItemList
                    disabled={$itemsClaimed}
                    itemList={option.grantsItems}
                    increase={true}
                />
                <Chip
                    disabled={$itemsClaimed}
                    inverted={true}
                    text="Claim"
                    onClick={() => onClick()}
                />
                <p class="option-text">{option.text}</p>
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

    .option-text {
        border-top: 1px solid rgba(255, 255, 255, 0.35);
        margin: 0;
        padding-top: 6px;
        width: 100%;
        font-weight: 500;
        line-height: 1.35;
    }
</style>
