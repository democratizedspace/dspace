<script>
    import { createEventDispatcher } from 'svelte';
    import Chip from './Chip.svelte';
  
    const SORT_SYMBOL_ASC = ' ↑';
    const SORT_SYMBOL_DESC = ' ↓';
  
    const dispatch = createEventDispatcher();
  
    export let sortFields = [];
  
    let sortState = {
      activeField: sortFields.length > 0 ? sortFields[0].field : null,
      order: 'asc',
    };
  
    function sort(field, func) {
      const newOrder = sortState.activeField === field && sortState.order === 'asc' ? 'desc' : 'asc';
      sortState = { activeField: field, order: newOrder };
      dispatch('sort', { field, order: newOrder, func });
    }
  </script>
  
  <div class="sorter">
    {#each sortFields as fieldObj}
      <Chip
        text={`${fieldObj.field}${sortState.activeField === fieldObj.field ? (sortState.order === 'asc' ? SORT_SYMBOL_ASC : SORT_SYMBOL_DESC) : ''}`}
        onClick={() => sort(fieldObj.field, fieldObj.func)}
        inverted={sortState.activeField === fieldObj.field}
      />
    {/each}
  </div>
  
  <style>
    .sorter {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
    }
  </style>
  