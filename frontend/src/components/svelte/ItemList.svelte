<script>
  import { writable } from 'svelte/store';
  import ItemCard from './ItemCard.svelte';
  import items from '../../pages/inventory/json/items.json';
  import SearchBar from './SearchBar.svelte';
  import Sorter from './Sorter.svelte';
  import { getPriceStringComponents } from '../../utils.js';
  import { getItemCount } from '../../utils/gameState.js';

  export let inventory;

  let fullItemList = items.map(item => ({ ...item }));
  
  // Create a derived list from fullItemList based on inventory prop
  let inventoryItemList = fullItemList.filter(item => inventory[item.id] !== undefined);

  const filteredItems = writable(inventoryItemList); // Use writable store

  function handleSearch(event) {
    $filteredItems = event.detail;
  }

  function handleSort({ detail }) {
    const { field, order } = detail;
    const sortField = sorterSortFields.find(sf => sf.field === field);
    const func = sortField.func || null;

    const sortFunc = (a, b) => {
      const aValue = func && field === sortField.field ? func(a) : a[field];
      const bValue = func && field === sortField.field ? func(b) : b[field];
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    };

    $filteredItems = $filteredItems.slice().sort(sortFunc);
    if (order === 'desc') {
      $filteredItems.reverse();
    }
  }

  const sorterSortFields = [
    { field: 'name' },
    {
      field: 'price',
      func: (item) => {
        const { price } = getPriceStringComponents(item.price);
        return price;
      },
    },
    {
      field: 'count',
      func: (item) => {
          return getItemCount(item.id);
      },
    }
  ];

  // Update the inventoryItemList when the inventory prop changes
  $: {
    inventoryItemList = fullItemList.filter(item => inventory[item.id] !== undefined);
    filteredItems.set(inventoryItemList);
  }
</script>

<div class="vertical">
  <SearchBar data={fullItemList} on:search="{handleSearch}" />

  <Sorter
    sortFields={[
      { field: 'name' },
      {
        field: 'price',
        func: (item) => {
          return item.price ? getPriceStringComponents(item.price).price : 0;
        },
      },
      {
        field: 'count',
        func: (item) => {
          return getItemCount(item.id);
        },
      },
    ]}
    on:sort="{handleSort}"
  />

  <div class="horizontal">
    {#each $filteredItems as item (item.id)}
      <ItemCard itemId={item.id} count={inventory[item.id]} />
    {/each}
  </div>
</div>

<style>
  .horizontal {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }

  .vertical {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
</style>
