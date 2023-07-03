<script>
    import KVList from "../../../components/svelte/KVList.svelte";
    import { onMount } from "svelte";
    import { getLocalStorage } from "../../../utils/localStorage.js";

    let mounted = false;
    let items = [];

    onMount(() => {
        mounted = true;
        
        items = getLocalStorage();
    });
</script>

<div>
    {#if mounted}
        <KVList items={items} />
    {/if}
</div>