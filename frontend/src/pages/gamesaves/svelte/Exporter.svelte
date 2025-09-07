<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import { onMount } from 'svelte';
    import { exportGameStateString, state, ready } from '../../../utils/gameState/common.js';
    import { copyToClipboard } from '../../../utils/copyToClipboard.js';

    let gameStateString = '';
    let loaded = false;

    onMount(async () => {
        await ready;
        gameStateString = exportGameStateString();
        loaded = true;
    });

    $: if (loaded && $state) {
        gameStateString = exportGameStateString();
    }
</script>

{#if loaded}
    <Chip text="">
        <div class="vertical">
            <p>Here is a string representation of your game state:</p>

            <!-- code block -->
            <div class="code-block">
                <code>{gameStateString}</code>
            </div>

            <Chip text="Copy" onClick={() => copyToClipboard(gameStateString)} inverted={true} />
        </div>
    </Chip>
{/if}

<style>
    p {
        font-weight: normal;
    }

    code {
        word-break: break-all;
    }

    .code-block {
        background-color: #f5f5f5;
        color: #000;
        margin: 10px;
        padding: 10px;
        border-radius: 10px;
    }
</style>
