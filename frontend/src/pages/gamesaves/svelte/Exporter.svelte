<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import { exportGameStateString, state, ready } from '../../../utils/gameState/common.js';
    import { copyToClipboard } from '../../../utils/copyToClipboard.js';
    import { onDestroy, onMount } from 'svelte';

    let gameStateString = '';
    let loaded = false;
    let copyState = 'idle';
    let resetCopyTimeout;

    onMount(async () => {
        await ready;
        loaded = true;
    });

    onDestroy(() => {
        if (resetCopyTimeout) {
            clearTimeout(resetCopyTimeout);
        }
    });

    const handleCopy = async () => {
        try {
            await copyToClipboard(gameStateString);
            copyState = 'copied';
            if (resetCopyTimeout) {
                clearTimeout(resetCopyTimeout);
            }
            resetCopyTimeout = setTimeout(() => {
                copyState = 'idle';
            }, 2000);
        } catch (error) {
            console.error('Failed to copy game state string', error);
        }
    };

    $: if (loaded) {
        const _gs = $state; // refresh when game state changes
        gameStateString = exportGameStateString();
    }

    $: copyButtonText = copyState === 'copied' ? 'Copied!' : 'Copy';
</script>

{#if loaded}
    <Chip text="">
        <div class="vertical">
            <p>
                Here is a portable backup envelope for your game state (with metadata). You can copy
                and paste it to another device or keep it for safekeeping.
            </p>

            <!-- code block -->
            <div class="code-block">
                <code>
                    {gameStateString}
                </code>
            </div>

            <Chip text={copyButtonText} onClick={handleCopy} inverted={true} />
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
