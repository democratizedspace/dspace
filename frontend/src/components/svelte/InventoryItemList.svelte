<script>
    import ItemCard from './ItemCard.svelte';
    import items from '../../pages/inventory/json/items.json';
    import SearchBar from './SearchBar.svelte';
  
    export let inventory;
  
    let fullItemList = items.map(item => ({ ...item }));
    let filteredItems = fullItemList; // Initially, filteredItems is the entire list
  
    function handleSearch(event) {
      filteredItems = event.detail;
    }
  </script>
  
  <!-- Pass the entire original data set (fullItemList) as the data prop -->
  <SearchBar data={fullItemList} on:search="{handleSearch}" />
  
  <div class="horizontal">
    {#each filteredItems as item (item.id)}
      {#if inventory[item.id]}
        <ItemCard itemId={item.id} count={inventory[item.id]} />
      {/if}
    {/each}
  </div>
  
  <style>
    .horizontal {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
    }
  </style>
  