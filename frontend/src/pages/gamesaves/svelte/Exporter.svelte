<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import { exportGameStateString } from '../../../utils/gameState.js';

    const gameStateString = exportGameStateString();
</script>

<Chip text="">
    <div class="vertical">
        <p>Here is a string representation of your game state:</p>

        <!-- code block -->
        <div class="code-block">
            <code>
                {gameStateString}
            </code>
        </div>

        <Chip text="Copy" onClick={() => navigator.clipboard.writeText(gameStateString)} inverted={true} />
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
</style>
