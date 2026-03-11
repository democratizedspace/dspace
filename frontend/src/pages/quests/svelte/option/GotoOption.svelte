<script>
    import { get, writable } from 'svelte/store';
    import Chip from '../../../../components/svelte/Chip.svelte';
    import CompactItemList from '../../../../components/svelte/CompactItemList.svelte';
    import { setCurrentDialogueStep } from '../../../../utils/gameState.js';
    import { state } from '../../../../utils/gameState/common.js';
    import { areItemRequirementsMet } from './itemRequirements.js';

    export let option, questId;

    const itemRequirementsMet = writable(
        areItemRequirementsMet(option.requiresItems, get(state)?.inventory, get(state))
    );

    async function onClick() {
        if ($itemRequirementsMet) {
            await setCurrentDialogueStep(questId, option.goto);
        }
    }

    $: {
        if ($state) {
            itemRequirementsMet.set(
                areItemRequirementsMet(option.requiresItems, $state.inventory, $state)
            );
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
