<script>
    import Chip from './Chip.svelte';
    import CompactItemList from './CompactItemList.svelte';
    import { state } from '../../utils/gameState.js';
    import { writable, derived } from 'svelte/store';

    export let text = '', items = [];

    const itemCounts = $state.inventory;

    const canProceed = derived([state], ([$state]) => {
        return items.every(item => {
            const inventoryItem = $state.inventory.find(i => i.id === item.id);
            return inventoryItem && inventoryItem.count >= item.count;
        });
    });
</script>

<Chip text={text}>
    <div class="vertical">
        <strong><p>The following items are required to proceed:</p></strong>
        <CompactItemList itemList={items} noRed={true} />
        <!-- Named slot with a slot name "requirements_met" -->
        {#if $$slots.requirements_met && $canProceed}
            <div class="requirements-met">
                <slot name="requirements_met" />
            </div>
        {/if}
    </div>
</Chip>

<style>
    .vertical {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
</style>
