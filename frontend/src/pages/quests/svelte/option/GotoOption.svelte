<script>
    import { writable } from 'svelte/store';
    import Chip from '../../../../components/svelte/Chip.svelte';
    import CompactItemList from '../../../../components/svelte/CompactItemList.svelte';
    import { state, setCurrentDialogueStep } from '../../../../utils/gameState';
    
    export let option, questId;

    const itemRequirementsMet = writable(option.requiresItems === undefined ? true : false);

    function onClick() {
        if ($itemRequirementsMet) {
            setCurrentDialogueStep(questId, option.goto);
        }
    }

    $: {
        if ($state) {
            if (option.requiresItems) {
                let met = true;
                for (let item of option.requiresItems) {
                    if (!$state.inventory[item.id] || $state.inventory[item.id] < item.count) {
                        met = false;
                        break;
                    }
                }
                itemRequirementsMet.set(met);
            }
        }
    }
</script>

<div>
    <Chip disabled={!$itemRequirementsMet} text={option.text} onClick={onClick}>
        {#if option.requiresItems && option.requiresItems.length > 0}
            <Chip inverted={true} text="">
                <div class="vertical">
                    Requires:
                    <CompactItemList itemList={option.requiresItems} increase={false} />
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