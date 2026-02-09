<script>
    import Chip from '../../../../components/svelte/Chip.svelte';
    import CompactItemList from '../../../../components/svelte/CompactItemList.svelte';
    import { get, writable } from 'svelte/store';
    import { finishQuest } from '../../../../utils/gameState.js';
    import { state } from '../../../../utils/gameState/common.js';
    import { loadGitHubToken, isValidGitHubToken } from '../../../../utils/githubToken.js';
    import { onMount } from 'svelte';
    import { areItemRequirementsMet } from './itemRequirements.js';

    export let quest, option;
    let githubConnected = false;
    const itemRequirementsMet = writable(
        areItemRequirementsMet(option.requiresItems, get(state)?.inventory)
    );
    let isDisabled = false;

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

    $: itemRequirementsMet.set(areItemRequirementsMet(option.requiresItems, $state?.inventory));

    $: isDisabled = (option.requiresGitHub && !githubConnected) || !$itemRequirementsMet;
</script>

<Chip text={option.text} {onClick} disabled={isDisabled}>
    <div class="vertical">
        Finish this quest and receive the following items:
        <CompactItemList itemList={quest.rewards || []} increase={true} />
        {#if option.requiresItems && option.requiresItems.length > 0}
            <Chip inverted={true} disabled={isDisabled} text="">
                <div class="vertical requirements">
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
        {#if option.requiresGitHub && !githubConnected}
            <p class="gate-warning">Connect GitHub to finish this quest.</p>
        {/if}
    </div>
</Chip>

<style>
    .vertical {
        display: flex;
        flex-direction: column;
    }

    .requirements {
        gap: 4px;
    }

    .gate-warning {
        margin: 6px 0 0;
        font-size: 0.9em;
        color: #f6c453;
    }
</style>
