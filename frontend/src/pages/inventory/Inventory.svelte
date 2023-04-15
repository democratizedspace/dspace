<script>
    import { state } from '../../utils/gameState.js';
    import ItemList from '../../components/svelte/InventoryItemList.svelte';
    import { writable } from 'svelte/store';
  
    // Create a writable store for inventory data
    const inventory = writable({});
  
    // Subscribe to the state store to update the inventory store
    $state.inventory && state.subscribe(($state) => {
      inventory.set($state.inventory);
    });
  </script>
  
  <div>
    <ItemList inventory={$inventory} />
  </div>
  