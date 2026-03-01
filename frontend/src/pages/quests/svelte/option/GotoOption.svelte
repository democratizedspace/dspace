<script>
    import { writable } from 'svelte/store';
    import Chip from '../../../../components/svelte/Chip.svelte';
    import CompactItemList from '../../../../components/svelte/CompactItemList.svelte';
    import { setCurrentDialogueStep } from '../../../../utils/gameState.js';
    import { state as gameStateStore } from '../../../../utils/gameState/common.js';
    import { areOptionRequirementsMet } from './itemRequirements.js';

    export let option, questId;

    const itemRequirementsMet = writable(areOptionRequirementsMet(option));

    function onClick() {
        if ($itemRequirementsMet) {
            setCurrentDialogueStep(questId, option.goto);
        }
    }

    $: {
        if ($gameStateStore) {
            itemRequirementsMet.set(areOptionRequirementsMet(option, $gameStateStore));
        }
    }
</script>

<div>
    <Chip disabled={!$itemRequirementsMet} text={option.text} {onClick}>
        {#if option.requiresItems && option.requiresItems.length > 0}
            <Chip inverted={true} disabled={!$itemRequirementsMet} text="">
                <div class="vertical">
                    Requires:
                    <CompactItemList
                        itemList={option.requiresItems}
                        disabled={!$itemRequirementsMet}
                        increase={false}
                        noRed={true}
                    />
                </div>
            </Chip>
        {/if}
    </Chip>
</div>

<style>
    .vertical {
        display: flex;
        flex-direction: column;
    }
</style>
