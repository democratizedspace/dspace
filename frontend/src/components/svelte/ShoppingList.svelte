<script>
    export let itemList = [];

    import { getItemCounts } from "../../utils/gameState/inventory.js";
</script>

<div>
    {#each itemList as item (item.id)}
        <div>
            <p>{item.id}</p>
            <p>{item.count}</p>
        </div>
    {/each}
</div>