<script>
  import ProgressBar from './ProgressBar.svelte';
  import { beforeUpdate, onMount } from 'svelte';
  import { startProcess, cancelProcess, finishProcess, getProcessState, ProcessStates, getProcessStartedAt } from '../../utils/gameState/processes.js';
  import processes from '../../pages/processes/processes.json';
  import { durationInSeconds } from '../../utils.js';
  import Chip from './Chip.svelte';
  import CompactItemList from './CompactItemList.svelte';

  export let processId;

  let process;
  let state = getProcessState(processId).state;
  let processStartedAt;
  let intervalId;
  let mounted = false;

  const updateState = () => {
    const processState = getProcessState(processId);
    state = processState.state;
    processStartedAt = getProcessStartedAt(processId);
  }

  const onProcessStart = () => {
    clearInterval(intervalId);
    startProcess(processId);
    intervalId = setInterval(updateState, 100);
    updateState();
  }

  const onProcessCancel = () => {
    clearInterval(intervalId);
    cancelProcess(processId);
    updateState();
  }
  
  const onProcessComplete = () => {
    clearInterval(intervalId);
    finishProcess(processId);
    updateState();
  }

  onMount(() => {
    mounted = true;
    updateState();
    intervalId = setInterval(updateState, 100);
  });

  beforeUpdate(updateState);

  $: {
    process = processes.find(p => p.id === processId);
    updateState();
    clearInterval(intervalId);
    intervalId = setInterval(updateState, 100);
  }
</script>

{#if mounted}
  <Chip text="">
    <div class="container">
      <h3>{process.title}</h3>

      {#if process.requireItems && process.requireItems.length > 0}
        <h6>Requires:</h6>
        <CompactItemList itemList={process.requireItems} noRed={true} />
      {/if}
      
      {#if process.consumeItems && process.consumeItems.length > 0}
        <h6>Consumes:</h6>
        <CompactItemList itemList={process.consumeItems} noRed={true} decrease={true} />
      {/if}
      
      {#if process.createItems && process.createItems.length > 0}
        <h6>Creates:</h6>
        <CompactItemList itemList={process.createItems} noRed={true} increase={true} />
      {/if}

      <h4>Duration: {process.duration}</h4>
      
      {#if state === ProcessStates.NOT_STARTED}
        <Chip text="Start" onClick={onProcessStart} inverted={true} />
      {:else if state === ProcessStates.IN_PROGRESS}
        <Chip text="Cancel" onClick={onProcessCancel} inverted={true} />
        <ProgressBar
          startDate={processStartedAt}
          totalDurationSeconds={durationInSeconds(process.duration)} 
        />
      {:else}
        <Chip text="Collect" onClick={onProcessComplete} inverted={true} />
      {/if}
    </div>
  </Chip>
{/if}

<style>
  .container {
    display: flex;
    flex-direction: column;
  }

  h3, h4, h6 {
    color: white;
    margin: 0px;
  }

  .button {
    padding: 10px 20px;
    font-size: 16px;
    background-color: #007bff;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 20px;
  }
</style>
