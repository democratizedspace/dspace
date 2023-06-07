<script>  
  import { createEventDispatcher } from 'svelte';  
  import { tweened } from 'svelte/motion';  
  import { prettyPrintDuration } from '../../utils.js';  

  const dispatch = createEventDispatcher();  
  export let startValue;  
  export let totalDurationInSeconds;  

  let percentageValue = tweened(startValue * 100, {duration: 0});  
  let stopTween;  
  let startTime;  
  let intervalId;  
  let remainingTime = calculateRemainingTime();  

  function calculateRemainingTime(elapsed = 0) {
    return prettyPrintDuration(totalDurationInSeconds - startValue * totalDurationInSeconds - elapsed);
  }

  function stopTweenAndClearInterval() {
    if (stopTween) stopTween();  
    clearInterval(intervalId);
  }

  function startUpdateInterval() {
    updateInterval();
    intervalId = setInterval(updateInterval, 100);  
  }

  function updateInterval() {
    const elapsed = (Date.now() - startTime) / 1000; 
    remainingTime = calculateRemainingTime(elapsed); 
  }

  export function startProgressBar() {  
    stopTweenAndClearInterval();  

    stopTween = percentageValue.subscribe(v => {  
      if (v >= 100) {  
        dispatch('processcomplete');  
        clearInterval(intervalId);  
      }  
    });  

    percentageValue.set(100, { duration: totalDurationInSeconds * 1000, easing: x => x });  
    startTime = Date.now();
    startUpdateInterval(); 
  }  

  export function resetProgressBar() {  
    stopTweenAndClearInterval();  
    percentageValue.set(0, { duration: 0 });  
    remainingTime = calculateRemainingTime(0);  
  }  

  $: {
    percentageValue.set(startValue * 100, {duration: 0}); // reactive statement for startValue changes
    remainingTime = calculateRemainingTime(0); // reactive statement for totalDurationInSeconds changes
  }
</script>

<div class="progress-bar-container">  
  <p>
    {$percentageValue.toFixed(2)}%
    {#if $percentageValue < 100} - {remainingTime}{/if}
  </p>  
  <div class="progress-bar">
    <div class="progress-bar-inner" style="width: {$percentageValue}%;"></div>
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
