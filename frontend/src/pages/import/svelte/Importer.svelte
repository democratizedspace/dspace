<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import CompactItemList from '../../../components/svelte/CompactItemList.svelte';
    import { onMount } from 'svelte';
    import { derived } from 'svelte/store';
    import { state, getVersionNumber, importV1V2, addItems, getItemCount } from '../../../utils/gameState.js';

    export let itemList = [];

    const newcomerToken = {
        id: "86",
        count: 1
    };

    let mounted = false, imported = false, currentVersion;

    let totalItemCount;

    const onImportItems = () => {
        if (imported) return;

        importV1V2(itemList);

        location.reload();
    };

    const acceptNewcomerToken = () => {
        addItems([newcomerToken]);
    };

    onMount(() => {
        mounted = true;

        currentVersion = getVersionNumber();

        if (currentVersion === "2") {
            imported = true;
        }
    });

    $: totalItemCount = itemList.length;
    const newcomerTokenCount = derived(state, $state => getItemCount(newcomerToken.id));
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
                        {totalItemCount} {totalItemCount > 1 ? "different " : ""} {totalItemCount === 1 ? "item" : "items"} found
                    </p>

                    {#if totalItemCount > 0}
                        <CompactItemList {itemList} noRed={true} increase={true} inverted={true} />

                        <div class="item">
                            <Chip
                                text="Import items"
                                disabled={itemList.length === 0}
                                inverted={false}
                                onClick={onImportItems}
                            />
                        </div>
                    {:else}
                        <p align="center">It looks like you didn't play v1 on this device, or your progress was wiped (by deleting cookies). In that case, take this token to hide this menu option!</p>
                        <CompactItemList
                            itemList={[newcomerToken]}
                            noRed={true}
                            increase={true}
                            inverted={true} />
                            <Chip text="Accept" onClick={acceptNewcomerToken} inverted={false} disabled={$newcomerTokenCount > 0} />

                            {#if $newcomerTokenCount > 0}
                                <Chip text="Go home" href="/" />
                            {/if}
                    {/if}

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
