<script>
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    export let duration;


    function startProcess() {
        progress.set(100);
    }

    const progress = tweened(0, {
		duration: duration,
		easing: cubicOut
	});
</script>

<span>
    <p>No item is actually created just yet. This page will be improved soon.</p>
    <button on:click={startProcess}>Start process</button>
    <progress value={$progress}></progress>
</span>


<style>
</style>