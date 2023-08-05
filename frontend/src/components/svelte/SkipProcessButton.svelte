<script>
    import { writable } from 'svelte/store';
    import Chip from './Chip.svelte';
    import { onMount } from 'svelte';
    import { skipProcess } from '../../utils/gameState/processes.js';

    export let processId;

    let mounted = writable(false);

    function onSkip() {
        if (!processId) return;

        console.log('skipping process', processId);

        skipProcess(processId);
    }

    onMount(() => {
        $mounted = true;
    });
</script>

<div>
    {#if $mounted}
        <Chip text="Skip" inverted={true} onClick={onSkip} />
    {/if}
</div>