<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { prettyPrintDuration } from "../../utils.js";

  export let startDate = new Date();
  export let totalDurationSeconds = 5;
  export let stopped = false;

  if (typeof startDate === 'string' || typeof startDate === 'number') {
    startDate = new Date(startDate);
  }

  let interval;
  let elapsedSeconds = 0;
  let progressRatio = 0;

  const dispatch = createEventDispatcher();

  const updateState = () => {
    const now = Date.now();
    const elapsedMillis = now - startDate.getTime(); // Milliseconds since the start date
    elapsedSeconds = Math.min(elapsedMillis / 1000, totalDurationSeconds);
    progressRatio = elapsedSeconds / totalDurationSeconds;
    if (elapsedSeconds >= totalDurationSeconds) {
      progressRatio = 1;
      clearInterval(interval);
      dispatch("fillComplete");
    }
  };

  const startProgress = () => {
    interval = setInterval(updateState, 100);
  };

  const stopProgress = () => {
    if (interval) {
      clearInterval(interval);
    }
    elapsedSeconds = 0;
    progressRatio = 0;
  };

  onMount(startProgress);
  onDestroy(stopProgress);
</script>

<div class="progress-container">
  {#if stopped}
      stopped
      <div class="progress-bar">
          <div
              class="progress-bar-fill"
              style="width: {(progressRatio * 100).toFixed(2)}%; transition: none"
          />
      </div>
  {:else}
      <div class="progress-bar">
          <div
              class="progress-bar-fill"
              style="width: {(progressRatio * 100).toFixed(2)}%; transition: width 0.1s linear"
          />
      </div>
  {/if}
  <p class="progress-text">
    Progress: {(progressRatio * 100).toFixed(2)}% | Time Left: {prettyPrintDuration(totalDurationSeconds - elapsedSeconds)}
  </p>
</div>

<style>
  .progress-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%; /* Or other fixed width if you wish */
  }

  .progress-bar {
    width: 100%;
    background-color: #f3f3f3;
    overflow: hidden;
    border-radius: 20px;
    margin: 5px;
  }

  .progress-bar-fill {
    height: 50px;
    background-color: #68d46d;
    transition: width 0.1s linear;
  }

  .progress-text {
    text-align: center;
  }
</style>
