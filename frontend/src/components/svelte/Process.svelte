<script>
  import { writable, derived } from 'svelte/store';
  import { onMount} from 'svelte';
  import processes from '../../pages/processes/processes.json';
  import CompactItemList from './CompactItemList.svelte';
  import ProgressBar from './ProgressBar.svelte';
  import Chip from './Chip.svelte';
  import { durationInSeconds } from '../../utils.js';
  import {
    startProcess as startProcessInGameState,
    finishProcess,
    cancelProcess,
    getProcessState,
    ProcessStates,
    hasRequiredAndConsumedItems,
    state
  } from '../../utils/gameState.js';

  export let processId;

  const process = processes.find((process) => process.id === processId);
  const processStateInfo = writable(getProcessState(processId));
  const canStartProcess = writable(false);

  let progressBar;

  function startProcess() {
    startProcessInGameState(processId);
    progressBar.startProgressBar();
    processStateInfo.set(getProcessState(processId));
  }

  function handleProcessComplete() {
    processStateInfo.set(getProcessState(processId));
  }

  function claimItems() {
    finishProcess(processId);
    processStateInfo.set(getProcessState(processId));
    progressBar.resetProgressBar();
  }

  function cancel() {
    cancelProcess(processId, process.consumeItems);
    processStateInfo.set(getProcessState(processId));
    // Reset the progress bar and stop its motion
    progressBar.resetProgressBar();
  }

  
  $: {
    processStateInfo.set(getProcessState(processId));
  }

  $: {
    if ($state) {
      canStartProcess.set(hasRequiredAndConsumedItems(processId));
    }
  }

  onMount(() => {
    if ($processStateInfo.state === ProcessStates.IN_PROGRESS) {
      progressBar.startProgressBar();
    }
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

  {#if $processStateInfo.state === ProcessStates.NOT_STARTED}
    <Chip inverted={true} text="Start" onClick={() => startProcess()} disabled={!$canStartProcess} />
  {:else if $processStateInfo.state === ProcessStates.IN_PROGRESS}
    <Chip inverted={true} text="Cancel" onClick={() => cancel()} />
  {:else}
    <Chip inverted={true} text="Claim your items" onClick={() => claimItems()} />
  {/if}

  <ProgressBar
    bind:this={progressBar}
    startValue={$processStateInfo.progress / 100}
    totalDurationInSeconds={durationInSeconds(process.duration)}
    on:processcomplete={handleProcessComplete}
  />
</div>

<style>
  .vertical {
    display: flex;
    flex-direction: column;
    align-items: left;
    gap: 10px;
  }

  p {
    margin: 0;
  }
</style>
