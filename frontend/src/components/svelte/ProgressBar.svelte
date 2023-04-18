<script>
  import { createEventDispatcher } from 'svelte';
  import { tweened } from 'svelte/motion';
  const dispatch = createEventDispatcher();

  export let startValue;
  export let totalDurationInSeconds;

  const value = tweened(startValue * 100);
  let percentage;
  let stopTween; // To store the stop function for the tween

  $: percentage = parseFloat($value.toFixed(2));

  export function startProgressBar() {
    // Stop any previous tween if exists
    if (stopTween) {
      stopTween();
    }
    // Start the tween, and store the stop function
    stopTween = value.subscribe(v => {
      if (v >= 100) {
        dispatch('processcomplete');
      }
    });
    value.set(100, {
      duration: totalDurationInSeconds * 1000,
      easing: x => x // linear easing
    });
  }
  
  export function resetProgressBar() {
    // Stop any previous tween if exists
    if (stopTween) {
      stopTween();
    }
    value.set(0, { duration: 0 });
  }
</script>

<div class="progress-bar-container">
  <p>{percentage}%</p>
  <div class="progress-bar">
    <div class="progress-bar-inner" style="width: {$value}%;"></div>
  </div>
</div>

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
    /* Remove the transition here */
  }
</style>
