<script>
    import Process from '../../../components/svelte/Process.svelte';
    import processes from '../../../generated/processes.json';
    import { getProcess } from '../../../utils/customcontent.js';
    import { onMount } from 'svelte';

    export let slug;

    let builtInProcess = processes.find((p) => p.id === slug);
    let processData = null;
    onMount(async () => {
        if (builtInProcess) return;

        try {
            const customProcess = await getProcess(slug);
            if (customProcess) {
                processData = customProcess;
            }
        } catch (error) {
            console.warn('Unable to load custom process:', error);
        }
    });
</script>

<div class="process-view">
    <Process inverted={true} processId={slug} {processData} />
</div>

<style>
    .process-view {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>
