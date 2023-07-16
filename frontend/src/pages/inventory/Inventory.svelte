<script>
  import { state } from '../../utils/gameState/common.js';
  import ItemList from '../../components/svelte/ItemList.svelte';
  import items from './json/items.json';

  let showAllItems = false;
  
  // Create an object with a count of 0 for items not in $state.inventory
  const allItems = items.reduce((acc, item) => {
    acc[item.id] = { count: $state.inventory[item.id] ? $state.inventory[item.id].count : 0 };
    return acc;
  }, {});

  // Reactive variable for the current inventory source
  let currentInventory = $state.inventory;

  // Update the current inventory source when the checkbox is toggled
  $: {
    currentInventory = showAllItems ? allItems : $state.inventory;
  }
</script>

<div>
  <div class="horizontal">
    <label>
      <input type="checkbox" class="checkbox" bind:checked={showAllItems} /> Show all items
    </label>
  </div>
  <ItemList inventory={currentInventory} />
</div>

<style>
  .horizontal {
    display: flex;
    flex-direction: row;
    align-items: center;
    /* center */
    justify-content: center;
  }

  label {
    margin-bottom: 20px;
  }

  .checkbox {
    transform: scale(2.5);
    cursor: pointer;
    margin: 10px;
  }
</style>
