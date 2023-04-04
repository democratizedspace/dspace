<script>
  import { onMount } from 'svelte';
  import items from '../inventory/json/items.json';
  import ItemList from '../../components/svelte/InventoryItemList.svelte';

  const filteredItems = items.filter(item => item.type === 'blueprint');

  onMount(() => {
  });

</script>

<div>
    <ItemList itemType="blueprint", includeItems={filteredItems} />
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
        width: 40%;
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
  