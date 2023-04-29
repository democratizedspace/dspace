<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { prettyPrintDuration } from '../../utils.js'; // Adjust path as needed

  const dispatch = createEventDispatcher();

  export let startValue;
  export let totalDurationInSeconds;

  const value = tweened(startValue * 100);
  let percentage = 0;
  let remainingTime = prettyPrintDuration(totalDurationInSeconds); // Initialize remainingTime
  let stopTween; // To store the stop function for the tween
  let endTimeTimestamp;
  let intervalId;
  let mounted = false;

  $: endTimeTimestamp = Date.now() + (1 - startValue) * totalDurationInSeconds * 1000;

  export function startProgressBar() {
    // Stop any previous tween if exists
    if (stopTween) {
      stopTween();
    }
    // Start the tween, and store the stop function
    stopTween = value.subscribe(v => {
      if (v >= 100) {
        dispatch('processcomplete');
        clearInterval(intervalId);
      }
    });
    value.set(100, {
      duration: totalDurationInSeconds * 1000,
      easing: x => x // linear easing
    });

    intervalId = setInterval(() => {
      const elapsed = (Date.now() - (endTimeTimestamp - totalDurationInSeconds * 1000)) / 1000; // Adjust elapsed calculation
      remainingTime = prettyPrintDuration(totalDurationInSeconds - elapsed); // Update remainingTime instead of duration
      percentage = Math.max(0, Math.min(100, elapsed / totalDurationInSeconds * 100));
      
      if (!mounted) {
        mounted = true;
      }
    }, 1000);
  }
  
  export function resetProgressBar() {
    // Stop any previous tween if exists
    if (stopTween) {
      stopTween();
    }
    value.set(0, { duration: 0 });
    clearInterval(intervalId);
  }

  onMount(() => {
    startProgressBar();
  });
</script>

{#if mounted}
  <div class="progress-bar-container">
    <p>{percentage.toFixed(2)}% - {remainingTime}</p>
    <div class="progress-bar">
      <div class="progress-bar-inner" style="width: {percentage}%;"></div>
    </div>
  </div>
{/if}

<style>
  .progress-bar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  p {
    margin: 0;
  }

  .progress-bar {
    background-color: #f3f3f3;
    border-radius: 5px;
    overflow: hidden;
    height: 20px;
    width: 90%;
    margin: 20px;
  }

  .progress-bar-inner {
    background-color: #4caf50;
    height: 100%;
  }
</style>
