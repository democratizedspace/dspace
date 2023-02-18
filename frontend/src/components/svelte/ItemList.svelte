<script>
    import items from '../../pages/inventory/json/items.json';
    import ItemCard from './ItemCard.svelte';

    export let itemType, includeTypes;

    let filteredItems = items.filter(item => item.type === itemType);
 
    if (includeTypes) {
        filteredItems = filteredItems.filter(item => includeTypes.includes(item.type));
    }

    console.log(filteredItems);
</script>

<div class="horizontal">
    {#each items as item}
        <!-- <ItemCard itemId={item.id} /> -->
        <ItemCard itemId={item.id} />
    {/each}
</div>

<style>
    img {
        /* small icon */
        width: 80%;
        margin: 5px;
        border-radius: 20px;
        /* nice green color for game rarity */
        border: 5px solid rgb(0, 89, 255);
    }

    .item {
        margin: 10px;
        border-radius: 10px;
        background-color: #68d46d;
        color: black;
        width: 25%;
        /* wrap content */
        flex-wrap: wrap;
        min-height: 200px;
        opacity: 0.8;
        padding: 20px;
    }

    .item:hover {
        opacity: 1;
        cursor: pointer;
    }

    .vertical {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .horizontal {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
    }
  </style>
  