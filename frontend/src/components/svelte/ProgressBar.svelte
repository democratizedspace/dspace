<script>
  import { createEventDispatcher } from 'svelte';  
  import { tweened } from 'svelte/motion';  
  import { prettyPrintDuration } from '../../utils.js';  
  import { getDurationString } from '../../utils/strings.js';

  const dispatch = createEventDispatcher();  

  // `startValue` is a prop for the initial state of the progress bar. 
  // It should be between 0 and 1, representing the percentage of completion.
  // For example, if progress bar should start half complete, `startValue` = 0.5.
  export let startValue;  

  // `totalDurationInSeconds` defines the total time for the progress bar 
  // to transition from 0% to 100%. If `startValue` is non-zero, the actual time
  // taken by the progress bar to reach 100% will be proportionally less.
  // E.g., if `totalDurationInSeconds` = 60 and `startValue` = 0.5, the progress 
  // bar will take 30 seconds to complete the transition from 50% to 100%.
  export let totalDurationInSeconds; 

  // `percentageValue` represents the current value of the progress bar.
  // It uses tweened store from Svelte for smooth animation of the progress.
  let percentageValue = tweened(startValue * 100, {duration: 0});  

  // `stopTween` is a function to stop the animation of the progress bar. It will 
  // be set when the progress bar animation starts.
  let stopTween; 

  let startTime;  
  let intervalId;  
  let remainingTime = calculateRemainingTime();

  // `calculateRemainingTime` returns the remaining time in human-readable format 
  // based on the elapsed time.
  function calculateRemainingTime(elapsed = 0) {
    return prettyPrintDuration(totalDurationInSeconds - startValue * totalDurationInSeconds - elapsed);
  }

  function stopTweenAndClearInterval() {
    if (stopTween) stopTween();  
    clearInterval(intervalId);
  }

  // `startUpdateInterval` sets up an interval to regularly update the elapsed 
  // and remaining time.
  function startUpdateInterval() {
    updateInterval();
    intervalId = setInterval(updateInterval, 100);  
  }

  // `updateInterval` calculates the elapsed time and updates the remaining time.
  function updateInterval() {
    const elapsed = (Date.now() - startTime) / 1000; 
    remainingTime = calculateRemainingTime(elapsed); 
  }

  export function startProgressBar() {  
    stopTweenAndClearInterval();  

    // When the progress reaches 100%, an event `processcomplete` is dispatched 
    // for other components which might be listening to this event.
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

  // The following reactive statements handle the changes in `startValue` and 
  // `totalDurationInSeconds`. If either of these props changes, the progress 
  // bar's current value (`percentageValue`) and remaining time are recalculated.
  $: {
    percentageValue.set(startValue * 100, {duration: 0}); // reactive statement for startValue changes
    remainingTime = calculateRemainingTime(0); // reactive statement for totalDurationInSeconds changes
  }
</script>

<div class="progress-bar-container">  
  <p>
    {getDurationString($percentageValue, remainingTime)}
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
