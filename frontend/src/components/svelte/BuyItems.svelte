<script>
    import Chip from './Chip.svelte';
    import items from '../../pages/inventory/json/items.json';

    export let itemList = [];

    const fullItemList = itemList.map((item) => {
        const fullItem = items.find((i) => i.id === item.id);
        const count = Number(item.count.toFixed(5));
        return { ...fullItem, count: count };
    });
</script>

<div class="vertical">
    {#each fullItemList as item (item.id)}
        <div class="horizontal">
            <Chip inverted={true} text="">
                <a href={`/inventory/item/${item.id}`}><img src={item.image} class="icon" alt={item.name} /></a>
                <p>{item.count} x {item.name}</p>
            </Chip>
        </div>
    {/each}
</div>

<style>
    .vertical {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .horizontal {
        display: flex;
        flex-direction: row;
        /* center items within the flex container */
        justify-content: center;
        align-items: center;
    }

    img {
        width: 50px;
        height: 50px;
        border-radius: 50%;
    }
</style>