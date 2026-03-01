<script>
    import Chip from '../../../../components/svelte/Chip.svelte';
    import CompactItemList from '../../../../components/svelte/CompactItemList.svelte';
    import { get, writable } from 'svelte/store';
    import { finishQuest } from '../../../../utils/gameState.js';
    import { state as gameStateStore } from '../../../../utils/gameState/common.js';
    import { isValidGitHubToken } from '../../../../utils/githubToken.js';
    import { areOptionRequirementsMet } from './itemRequirements.js';

    export let quest, option;
    let githubConnected = false;
    const itemRequirementsMet = writable(areOptionRequirementsMet(option, get(gameStateStore)));
    let isDisabled = false;

    function onClick() {
        if (option.requiresGitHub && !githubConnected) return;
        if (!$itemRequirementsMet) return;
        finishQuest(quest.id, quest.rewards || []);
    }

    $: {
        if ($gameStateStore) {
            itemRequirementsMet.set(areOptionRequirementsMet(option, $gameStateStore));
        }
    }

    $: {
        githubConnected = option.requiresGitHub
            ? isValidGitHubToken($gameStateStore?.github?.token)
            : false;
    }

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
            <Chip inverted={true} disabled={isDisabled} text="">
                <div class="vertical requirements">
                    Requires:
                    <span>Connect GitHub to finish this quest.</span>
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

    .requirements {
        gap: 4px;
    }
</style>
