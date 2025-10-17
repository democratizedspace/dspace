<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import { importCustomContentString } from '../../../utils/customcontent.js';

    const IMPORT_LABEL = 'Paste your custom content backup here';
    const IMPORT_TEXTAREA_ID = 'custom-content-import-textarea';
    let importString = '';
    const handleImport = async () => {
        try {
            await importCustomContentString(importString);
        } catch (err) {
            console.error('Failed to import custom content:', err);
        }
    };
</script>

<section class="importer-card">
    <div class="vertical">
        <label class="input-label" for={IMPORT_TEXTAREA_ID}>
            {IMPORT_LABEL}<span aria-hidden="true">:</span>
        </label>
        <div class="input-block">
            <textarea
                id={IMPORT_TEXTAREA_ID}
                aria-label={IMPORT_LABEL}
                bind:value={importString}
            />
        </div>
        <Chip text="Import" onClick={handleImport} inverted={true} />
    </div>
</section>

<style>
    .importer-card {
        display: inline-flex;
        flex-direction: column;
        align-items: stretch;
        background-color: #007006;
        border-radius: 0.4rem;
        color: white;
        margin: 1px;
        padding: 6px 5px;
        gap: 4px;
    }

    .input-label {
        font-weight: normal;
        margin: 0 10px;
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
