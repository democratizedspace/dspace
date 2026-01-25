<script>
    import { writable } from 'svelte/store';
    import Chip from '../../../../components/svelte/Chip.svelte';
    import CompactItemList from '../../../../components/svelte/CompactItemList.svelte';
    import { finishQuest } from '../../../../utils/gameState.js';
    import { state } from '../../../../utils/gameState/common.js';
    import { loadGitHubToken, isValidGitHubToken } from '../../../../utils/githubToken.js';
    import { onMount } from 'svelte';

    export let quest, option;
    let githubConnected = false;
    const itemRequirementsMet = writable(option.requiresItems === undefined ? true : false);

    async function checkConnection() {
        const token = await loadGitHubToken();
        githubConnected = isValidGitHubToken(token);
    }

    onMount(checkConnection);

    function onClick() {
        if (option.requiresGitHub && !githubConnected) return;
        if (!$itemRequirementsMet) return;
        finishQuest(quest.id, quest.rewards || []);
    }

    $: {
        if ($state && option.requiresItems) {
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

    $: isDisabled = (option.requiresGitHub && !githubConnected) || !$itemRequirementsMet;
</script>

<Chip text={option.text} onClick={() => onClick()} disabled={isDisabled}>
    <div class="vertical">
        {#if option.requiresItems && option.requiresItems.length > 0}
            <div class="requirements">
                Requires:
                <CompactItemList
                    itemList={option.requiresItems}
                    disabled={isDisabled}
                    increase={false}
                    noRed={true}
                />
            </div>
        {/if}
        Finish this quest and receive the following items:
        <CompactItemList itemList={quest.rewards || []} increase={true} />
    </div>
</Chip>

<style>
    .vertical {
        display: flex;
        flex-direction: column;
    }

    .requirements {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>
