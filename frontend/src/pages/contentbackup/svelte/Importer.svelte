<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import { importCustomContentString } from '../../../utils/customcontent.js';

    let importString = '';
    const handleImport = async () => {
        try {
            await importCustomContentString(importString);
        } catch (err) {
            console.error('Failed to import custom content:', err);
        }
    };
</script>

<Chip text="">
    <div class="vertical">
        <p>Paste your custom content backup here:</p>
        <div class="input-block">
            <textarea bind:value={importString} data-testid="custom-backup-input" />
        </div>
        <Chip text="Import" on:click={handleImport} inverted={true} />
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
</style>
