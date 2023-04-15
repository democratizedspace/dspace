<script>
    import { createEventDispatcher } from 'svelte';
  
    const dispatch = createEventDispatcher();
  
    export let data = [];
  
    let searchQuery = '';
    let originalData = []; // Store a copy of the original data
  
    // Update originalData whenever data changes
    $: originalData = [...data];
  
    function handleInput(event) {
      searchQuery = event.target.value;
      let filteredItems;
      if (searchQuery.trim() === "") {
        filteredItems = originalData; // Use original data when search bar is cleared
      } else {
        const words = searchQuery.toLowerCase().split(/\s+/);
        filteredItems = originalData.filter(item => {
          const itemText = [
            item.id?.toLowerCase() ?? "",
            item.name?.toLowerCase() ?? "",
            item.description?.toLowerCase() ?? "",
            item.price?.toLowerCase() ?? "",
          ].join(" ");
          return words.every(word => itemText.includes(word));
        });
      }
      dispatch('search', filteredItems);
    }
  </script>
  
  <style>
    input {
      width: 80%;
      padding: 10px;
      font-size: 16px;
      border: 1px solid #ccc;
      margin-bottom: 10px;
      display: block;
      margin-left: auto;
      margin-right: auto;
      border-radius: 20px;
    }
  </style>
  
  <input
    type="text"
    bind:value="{searchQuery}"
    placeholder="Search..."
    on:input="{handleInput}"
  />
  