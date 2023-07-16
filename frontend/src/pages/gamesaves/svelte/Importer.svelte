<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import { importGameStateString } from '../../../utils/gameState/common.js';

    let importString = '';

    const handleImport = () => {
        try {
            importGameStateString(importString);
        } catch (err) {
            console.error('Failed to import game state:', err);
        }
    };
</script>

<Chip text="">
    <div class="vertical">
        <p>Paste the string representation of your game state here:</p>

        <!-- input block -->
        <div class="input-block">
            <textarea bind:value={importString}></textarea>
        </div>

        <Chip text="Import" onClick={handleImport} inverted={true} />
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
