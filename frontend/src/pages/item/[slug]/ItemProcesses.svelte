<script>
    import Process from '../../../components/svelte/Process.svelte';
    import { writable, derived } from 'svelte/store';

    export let processes = [];

    let order = writable('name');
    const processesStore = writable(processes);
    $: processesStore.set(processes);

    const sorted = derived([order, processesStore], ([$order, $processes]) => {
        const arr = [...$processes];
        if ($order === 'timeAsc') {
            arr.sort((a, b) => a.duration - b.duration);
        } else if ($order === 'timeDesc') {
            arr.sort((a, b) => b.duration - a.duration);
        } else {
            arr.sort((a, b) => (a.name || a.title).localeCompare(b.name || b.title));
        }
        return arr;
    });
</script>

<select bind:value={order}>
    <option value="name">Name A→Z</option>
    <option value="timeAsc">Time ↑</option>
    <option value="timeDesc">Time ↓</option>
</select>

{#each $sorted as p}
    <Process processId={p.id} />
{/each}
