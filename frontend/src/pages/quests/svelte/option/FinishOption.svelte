<script>
    import Chip from '../../../../components/svelte/Chip.svelte';
    import CompactItemList from '../../../../components/svelte/CompactItemList.svelte';
    import { get, writable } from 'svelte/store';
    import { finishQuest } from '../../../../utils/gameState.js';
    import { state } from '../../../../utils/gameState/common.js';
    import { isValidGitHubToken } from '../../../../utils/githubToken.js';
    import { areItemRequirementsMet } from './itemRequirements.js';

    export let quest, option;
    let githubConnected = false;
    const itemRequirementsMet = writable(
        areItemRequirementsMet(option.requiresItems, get(state)?.inventory, get(state))
    );
    let isDisabled = false;

    function onClick() {
        if (option.requiresGitHub && !githubConnected) return;
        if (!$itemRequirementsMet) return;
        finishQuest(quest.id, quest.rewards || []);
    }

    $: {
        if ($state) {
            itemRequirementsMet.set(
                areItemRequirementsMet(option.requiresItems, $state.inventory, $state)
            );
        }
    }

    $: {
        githubConnected = option.requiresGitHub ? isValidGitHubToken($state?.github?.token) : false;
    }

    $: isDisabled = (option.requiresGitHub && !githubConnected) || !$itemRequirementsMet;
</script>

<Chip {onClick} disabled={isDisabled}>
    <div class="option-layout">
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
        <p class="option-text">{option.text}</p>
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
