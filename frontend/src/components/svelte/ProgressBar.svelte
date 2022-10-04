<script>
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    export let duration;

    console.log("progress bar duration: ", duration);

    function startProcess() {
        console.log("process duration: ", duration);
        progress.set(100);
    }

    const progress = tweened(0, {
		duration: duration,
		easing: cubicOut
	});
</script>

<span>
    <p>Initial version. This will be fleshed out more soon.</p>
    <button on:click={startProcess}>Start process</button>
    <progress value={$progress}></progress>
</span>


<style>
</style>