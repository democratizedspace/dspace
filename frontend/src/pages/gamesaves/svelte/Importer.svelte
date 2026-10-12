<script>
    import { onMount } from 'svelte';
    import { initializeCustomContentForImportUI } from '../../../utils/indexeddb.js';
    import Chip from '../../../components/svelte/Chip.svelte';
    import {
        importGameStateString,
        recoverImportGameState,
        getImportRecoveryStatus,
    } from '../../../utils/gameState/common.js';

    let destinationReady = Promise.resolve(false);
    onMount(() => {
        destinationReady = initializeCustomContentForImportUI().then(
            () => true,
            () => false
        );
    });

    let importString = '';

    let errorMessage = '';
    let recoveryMode = getImportRecoveryStatus();

    const handleImport = async () => {
        await destinationReady;
        errorMessage = '';
        try {
            const receipt = await importGameStateString(importString);
            if (receipt.status === 'best-effort')
                errorMessage =
                    'Imported using best-effort local storage. Provider credentials remain disabled.';
            recoveryMode = getImportRecoveryStatus();
        } catch (err) {
            errorMessage = ['partial', 'mirror-incomplete', 'fallback-reload-required'].includes(
                err.code
            )
                ? err.message
                : 'Import failed. Please double-check the backup string and try again.';
            recoveryMode = getImportRecoveryStatus();
        }
    };
    const recover = async () => {
        try {
            await recoverImportGameState();
            errorMessage =
                recoveryMode === 'mirrors'
                    ? 'Saved mirrors repaired.'
                    : 'Previous game state recovered. Custom content was not imported.';
        } catch {
            errorMessage =
                'Recovery could not finish or newer work exists. No automatic overwrite was attempted.';
        }
        recoveryMode = getImportRecoveryStatus();
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
        {#if recoveryMode}
            <button type="button" on:click={recover}
                >{recoveryMode === 'mirrors'
                    ? 'Retry saved mirrors'
                    : 'Recover previous game state'}</button
            >
            <p>
                Recovery is available only in this tab until reload, a newer change, or credential
                Clear.
            </p>
        {/if}
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
