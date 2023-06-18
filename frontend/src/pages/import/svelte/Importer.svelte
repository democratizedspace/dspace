<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import CompactItemList from '../../../components/svelte/CompactItemList.svelte';
    import { onMount } from 'svelte';
    import { getVersionNumber, importV1V2 } from '../../../utils/gameState.js';

    export let itemList = [];

    let mounted = false, imported = false, currentVersion;

    const totalItemCount = itemList.length;

    const onImportItems = () => {
        if (imported) return;

        importV1V2(itemList);

        location.reload();
    };

    onMount(() => {
        mounted = true;

        currentVersion = getVersionNumber();

        if (currentVersion === "2") {
            imported = true;
        }
    });
</script>

{#if mounted}
    <div class="outer">
        <div class="inner">
            <div class="vertical">
                {#if imported}
                    <div class="item vertical">
                        <p>Done!</p>
                        <p>You can click the button below to remove cookies used for DSPACE v1. Completing this step removes "Import from v1" menu item.</p>
                        <Chip text="Remove v1" href="/import/v2/v1/done" inverted={false} />
                    </div>
                {:else}
                    <p align="center">
                        {totalItemCount} {totalItemCount === 1 ? "item" : "different items"} found
                    </p>

                    <CompactItemList {itemList} noRed={true} increase={true} inverted={true} />

                    <div class="item">
                        <Chip
                            text="Import items"
                            disabled={itemList.length === 0}
                            inverted={false}
                            onClick={onImportItems}
                        />
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .outer {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
    }

    p {
        width: 100%;
        font-weight: normal;
    }

    .inner {
        background-color: #68D46D;
        color: black;
        padding: 5px;
        margin: 20px;
        border-radius: 5px;
    }

    .vertical {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .item {
        margin: 20px;
    }
</style>
