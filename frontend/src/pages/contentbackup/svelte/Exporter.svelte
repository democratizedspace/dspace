<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import { exportCustomContentString } from '../../../utils/customcontent.js';
    import { copyToClipboard } from '../../../utils/copyToClipboard.js';

    let backupString = '';
    exportCustomContentString().then((str) => (backupString = str));
</script>

<Chip text="">
    <div class="vertical">
        <p>Custom content backup string:</p>
        <div class="code-block">
            <code data-testid="custom-backup-export">{backupString}</code>
        </div>
        <Chip text="Copy" on:click={() => copyToClipboard(backupString)} inverted={true} />
    </div>
</Chip>

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
    .vertical {
        display: flex;
        flex-direction: column;
    }
</style>
