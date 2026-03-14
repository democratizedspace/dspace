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
    <Chip disabled={!$itemRequirementsMet} text="" {onClick}>
        <div class="vertical option-content">
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

    .option-content {
        align-items: center;
        gap: 6px;
    }

    .option-text {
        border-top: 1px solid rgba(255, 255, 255, 0.35);
        margin: 2px 0 0;
        padding-top: 6px;
        width: 100%;
        font-weight: 500;
        line-height: 1.35;
    }
</style>
