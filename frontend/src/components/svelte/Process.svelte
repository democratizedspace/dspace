<script>
  import { onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import Chip from './Chip.svelte';
  import processes from '../../pages/processes/processes.json';
  import { prettyPrintDuration, durationInSeconds } from '../../utils.js';
  import CompactItemList from './CompactItemList.svelte';
  import { startProcess, processFinished, finishProcess, cancelProcess } from '../../utils/gameState.js';

  export let processId;

  const process = processes.find((process) => process.id === processId);

  let progress = writable(0);
  let timeLeft = writable(durationInSeconds(process.duration) * 1000);
  let interval;

  function startProgressBar() {
    progress.set(0);
    clearInterval(interval);

    let start = Date.now();
    let duration = durationInSeconds(process.duration) * 1000;
    interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const percentage = Math.min((elapsed / duration) * 100, 100);
      progress.set(parseFloat(percentage.toFixed(2)));

      timeLeft.set(duration - elapsed);

      if (elapsed >= duration) {
        finishProcess(processId);
        clearInterval(interval);
      }
    }, 10);

    startProcess(processId);
  }

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div class="vertical">
  <p>{process.title}</p>

  <div class="right-aligned">
    <p>Requires:</p>
    <CompactItemList itemList={process.requireItems} />

    <p>Consumes:</p>
    <CompactItemList itemList={process.consumeItems} />
    
    <p>Creates:</p>
    <CompactItemList itemList={process.createItems} increase={true} />
  </div>

  <div class="vertical left-aligned">
    <p>Time left: {prettyPrintDuration($timeLeft / 1000, true)}</p>
    <p>Progress: {($progress).toFixed(2)}%</p>
  </div>

  <Chip inverted={true} text="Start" onClick={() => startProgressBar()} />

  <div class="progress-container">
    <div class="progress-bar" style="width: {$progress}%"></div>
  </div>
</div>

<style>
  .progress-container {
    height: 20px;
    width: 100%;
    background-color: #f3f3f3;
    position: relative;
    margin: 20px;
  }

  .progress-bar {
    height: 100%;
    width: 100%;
    position: absolute;
    left: 0;
    top: 0;
    background-color: #4caf50;
  }

  .vertical {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .left-aligned {
    align-items: flex-start;
    width: 100%;
  }

  .right-aligned {
    align-items: flex-end;
    width: 100%;
  }

  p {
    margin: 0;
  }
</style>
