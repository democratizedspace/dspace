<script>
    import items from '../inventory/json/items.json';
    import ItemCard from '../../components/svelte/ItemCard.svelte';
    import ItemList from '../../components/svelte/InventoryItemList.svelte';
</script>

<ItemList />

<style>
    img {
        /* small icon */
        width: 100%;
        border-radius: 20px;
        /* nice green color for game rarity */
        border: 5px solid rgb(0, 89, 255);
    }

    p {
        text-align: center;
        font-size: 0.8rem;
        margin: 0px;
    }

    .name {
        min-height: 60px;
        text-align: center;
    }

    .description {
        min-height: 80px;
    }

    .item {
        margin: 5px;
        border-radius: 10px;
        background-color: #68d46d;
        color: black;
        width: 30%;
        opacity: 0.8;
        padding: 20px;
        padding-left: 10px;
        padding-top: 10px;
    }

    /* for mobile devices, make the description text smaller */
    @media only screen and (max-width: 600px) {
        .description {
            font-size: 0.6rem;
        }
    }

    .item:hover {
        opacity: 1;
        cursor: pointer;
    }

    .vertical {
        display: flex;
        flex-direction: column;
    }

    .horizontal {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
    }
  </style>
  