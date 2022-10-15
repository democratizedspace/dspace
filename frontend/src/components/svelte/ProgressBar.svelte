<script>
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    export let duration;

    function startProcess() {
        progress.set(1);
    }

    const progress = tweened(0, {
		duration: duration
	});
</script>

<span>
    <button on:click={startProcess}>Start process</button>
    <progress value={$progress}></progress>
</span>


<style>
</style>