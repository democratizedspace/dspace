<script>
    import { writable } from 'svelte/store';
    import Chip from '../../../../components/svelte/Chip.svelte';
    import CompactItemList from '../../../../components/svelte/CompactItemList.svelte';
    import { finishQuest } from '../../../../utils/gameState.js';
    import { loadGitHubToken, isValidGitHubToken } from '../../../../utils/githubToken.js';
    import { state } from '../../../../utils/gameState/common.js';
    import { onMount } from 'svelte';

    export let quest, option;
    let githubConnected = false;
    let hasRequiredItems = false;
    let isDisabled = false;
    const itemRequirementsMet = writable(option.requiresItems === undefined ? true : false);
    $: hasRequiredItems = Boolean(option.requiresItems?.length);
    $: isDisabled = (option.requiresGitHub && !githubConnected) || !$itemRequirementsMet;

    async function checkConnection() {
        const token = await loadGitHubToken();
        githubConnected = isValidGitHubToken(token);
    }

    onMount(checkConnection);

    function onClick() {
        if (isDisabled) return;
        finishQuest(quest.id, quest.rewards || []);
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

<Chip text={option.text} onClick={() => onClick()} disabled={isDisabled}>
    <div class="vertical">
        Finish this quest and receive the following items:
        <CompactItemList itemList={quest.rewards || []} increase={true} />
        {#if hasRequiredItems}
            <Chip inverted={true} disabled={isDisabled} text="">
                <div class="vertical">
                    Requires:
                    <CompactItemList
                        itemList={option.requiresItems}
                        disabled={isDisabled}
                        increase={false}
                        noRed={true}
                    />
                </div>
            </Chip>
        {/if}
    </div>
</Chip>

<style>
    .vertical {
        display: flex;
        flex-direction: column;
    }
</style>
