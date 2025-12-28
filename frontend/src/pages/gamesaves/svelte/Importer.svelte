<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import { importGameStateString } from '../../../utils/gameState/common.js';

    let importString = '';

    let errorMessage = '';

    const handleImport = async () => {
        errorMessage = '';
        try {
            await importGameStateString(importString);
        } catch (err) {
            console.error('Failed to import game state:', err);
            errorMessage = 'Import failed. Please double-check the backup string and try again.';
        }
    };
</script>

<Chip text="">
    <div class="vertical">
        <p>Paste a game state backup string (envelope or raw state) here:</p>

        <!-- input block -->
        <div class="input-block">
            <textarea bind:value={importString}></textarea>
        </div>

        <Chip text="Import" onClick={handleImport} inverted={true} />
        {#if errorMessage}
            <p class="error">{errorMessage}</p>
        {/if}
    </div>
</Chip>

<style>
    p {
        font-weight: normal;
    }

    textarea {
        width: 100%;
        height: 200px;
    }

    .input-block {
        background-color: #f5f5f5;
        color: #000;
        margin: 10px;
        padding: 10px;
        border-radius: 10px;
    }

    .vertical {
        display: flex;
        flex-direction: column;
    }

    .error {
        color: #b00020;
        margin: 0 10px 10px;
    }
</style>
