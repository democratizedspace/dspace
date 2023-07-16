<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import { addItems } from '../../../utils/gameState/inventory.js';

    addItems([
        {
            "id": ""
        }
    ]);
</script>

<div class="container">
    <Chip text="" inverted={true}>
        <div class="vertical">
            <p>All data associated with DSPACE v1 has been removed.</p>
            <Chip text="Go back home" href="/" />
        </div>
    </Chip>
</div>

<style>
    .container {
        display: flex;
        justify-content: center;
    }

    .vertical {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    p {
        font-weight: normal;
    }
</style>