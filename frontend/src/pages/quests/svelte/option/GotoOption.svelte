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

    function onClick() {
        if ($itemRequirementsMet) {
            setCurrentDialogueStep(questId, option.goto);
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
    <Chip disabled={!$itemRequirementsMet} {onClick}>
        <div class="option-layout">
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
            <p class="option-text">{option.text}</p>
        </div>
    </Chip>
</div>

<style>
    .vertical {
        display: flex;
        flex-direction: column;
    }

    .option-layout {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .option-text {
        margin: 0;
        padding-top: 6px;
        border-top: 1px solid rgba(255, 255, 255, 0.35);
        text-align: left;
        font-weight: 400;
        line-height: 1.35;
    }
</style>
