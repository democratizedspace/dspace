<script>
    import { onMount, onDestroy } from 'svelte';
    import { prettyPrintDuration } from '../../utils.js';
  
    export let endDate;
    export let totalDurationInSeconds;
  
    let intervalId;
    let timeRemaining;
  
    const updateTimeRemaining = () => {
      const timeDiffInSeconds = Math.round((endDate - Date.now()) / 1000);
      if (timeDiffInSeconds > 0) {
        timeRemaining = prettyPrintDuration(timeDiffInSeconds, false);
      } else if (totalDurationInSeconds > 0) {
        timeRemaining = prettyPrintDuration(totalDurationInSeconds, false);
      } else {
        timeRemaining = '0s';
      }
    }
  
    onMount(() => {
      updateTimeRemaining();
      intervalId = setInterval(updateTimeRemaining, 1000);
    });
  
    onDestroy(() => {
      clearInterval(intervalId);
    });
  </script>
  
  <p>{timeRemaining} remaining</p>
  
  <style>
    p {
      margin: 0;
    }
  </style>
  