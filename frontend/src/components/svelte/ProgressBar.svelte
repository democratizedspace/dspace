<script>  
  import { createEventDispatcher } from 'svelte';  
  import { tweened } from 'svelte/motion';  
  import { prettyPrintDuration } from '../../utils.js'; // Adjust path as needed  

  const dispatch = createEventDispatcher();  

  export let startValue;  
  export let totalDurationInSeconds;  

  const value = tweened(startValue * 100, {duration: 0});  
  let percentage = startValue * 100;  
  let remainingTime = prettyPrintDuration(totalDurationInSeconds); // Initialize remainingTime  
  let stopTween; // To store the stop function for the tween  
  let startTimeTimestamp; // Changed from endTimeTimestamp  
  let intervalId;  
  let mounted = false;  

  export function startProgressBar() {  
    // Stop any previous tween if exists  
    if (stopTween) {  
      stopTween();  
    }  
    // Start the tween, and store the stop function  
    stopTween = value.subscribe(v => {  
      percentage = v;  
      if (v >= 100) {  
        dispatch('processcomplete');  
        clearInterval(intervalId);  
      }  
    });  
    value.set(100, {  
      duration: totalDurationInSeconds * 1000,  
      easing: x => x // linear easing  
    });  

    // Record the starting time
    startTimeTimestamp = Date.now();

    // Start the interval immediately, instead of after 1 second
    updateInterval();

    intervalId = setInterval(updateInterval, 100);  
  }  

  export function resetProgressBar() {  
    // Stop any previous tween if exists  
    if (stopTween) {  
      stopTween();  
    }  
    value.set(0, { duration: 0 });  
    clearInterval(intervalId);  

    // Reset remainingTime to the total duration when the progress bar is reset
    remainingTime = prettyPrintDuration(totalDurationInSeconds);  
  }  

  // Separate function for interval updates
  function updateInterval() {
    const elapsed = (Date.now() - startTimeTimestamp) / 1000; // Adjust elapsed calculation  
    remainingTime = prettyPrintDuration(totalDurationInSeconds - elapsed); // Update remainingTime instead of duration  

    if (!mounted) {  
      mounted = true;  
    }  
  }
</script>

<div class="progress-bar-container">  
  <p>
    {$value.toFixed(2)}%
    {#if $value < 100} - {remainingTime}{/if}
  </p>  
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
  }
</style>
