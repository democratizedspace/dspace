<script>
    import Chip from '../../../../components/svelte/Chip.svelte';
    import CompactItemList from '../../../../components/svelte/CompactItemList.svelte';
    import { finishQuest } from '../../../../utils/gameState.js';
    import { loadGitHubToken, isValidGitHubToken } from '../../../../utils/githubToken.js';
    import { onMount } from 'svelte';

    export let quest, option;
    let githubConnected = false;

    async function checkConnection() {
        const token = await loadGitHubToken();
        githubConnected = isValidGitHubToken(token);
    }

    onMount(checkConnection);

    function onClick() {
        if (option.requiresGitHub && !githubConnected) return;
        finishQuest(quest.id, quest.rewards || []);
    }
</script>

<Chip
    text={option.text}
    onClick={() => onClick()}
    disabled={option.requiresGitHub && !githubConnected}
>
    <div class="vertical">
        Finish this quest and receive the following items:
        <CompactItemList itemList={quest.rewards || []} increase={true} />
    </div>
</Chip>

<style>
    .vertical {
        display: flex;
        flex-direction: column;
    }
</style>
