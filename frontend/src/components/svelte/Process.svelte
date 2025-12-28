<script>
    import ProgressBar from './ProgressBar.svelte';
    import RemainingTime from './RemainingTime.svelte';
    import { beforeUpdate, onDestroy, onMount } from 'svelte';
    import {
        startProcess,
        cancelProcess,
        finishProcess,
        pauseProcess,
        resumeProcess,
        getProcessState,
        ProcessStates,
        getProcessStartedAt,
        finishProcessNow,
    } from '../../utils/gameState/processes.js';
    import {
        getRuntimeCheatsAvailability,
        initializeQaCheats,
        qaCheatsEnabled,
    } from '../../lib/qaCheats';
    import processes from '../../generated/processes.json';
    import { durationInSeconds } from '../../utils.js';
    import Chip from './Chip.svelte';
    import CompactItemList from './CompactItemList.svelte';

    export let processId;
    export let processData = null;

    let process;
    let isCustomProcess = false;
    let state = getProcessState(processId).state;
    let processStartedAt;
    let intervalId;
    let mounted = false;
    let totalDurationSeconds;
    let cheatsAvailable = getRuntimeCheatsAvailability();
    let cheatsEnabled = false;
    let showCheatAction = false;
    let cleanupCheats;
    let unsubscribeCheats;

    const updateState = () => {
        if (isCustomProcess || !process) {
            state = ProcessStates.NOT_STARTED;
            processStartedAt = undefined;
            return;
        }

        const processState = getProcessState(processId);
        state = processState.state;
        processStartedAt = getProcessStartedAt(processId);
    };

    const onProcessStart = () => {
        if (isCustomProcess) {
            return;
        }

        clearInterval(intervalId);
        startProcess(processId);
        intervalId = setInterval(updateState, 100);
        updateState();
    };

    const onProcessCancel = () => {
        if (isCustomProcess) {
            return;
        }

        clearInterval(intervalId);
        cancelProcess(processId);
        updateState();
    };

    const onProcessComplete = () => {
        if (isCustomProcess) {
            return;
        }

        clearInterval(intervalId);
        finishProcess(processId);
        updateState();
    };

    const onProcessFinishNow = () => {
        if (isCustomProcess) {
            return;
        }

        finishProcessNow(processId);
        updateState();
    };

    const onProcessPause = () => {
        if (isCustomProcess) {
            return;
        }

        clearInterval(intervalId);
        pauseProcess(processId);
        updateState();
    };

    const onProcessResume = () => {
        if (isCustomProcess) {
            return;
        }

        resumeProcess(processId);
        intervalId = setInterval(updateState, 100);
        updateState();
    };

    onMount(() => {
        mounted = true;
        cheatsAvailable = getRuntimeCheatsAvailability();
        cleanupCheats = initializeQaCheats(cheatsAvailable);
        unsubscribeCheats = qaCheatsEnabled.subscribe((enabled) => {
            cheatsEnabled = enabled && cheatsAvailable;
        });
        updateState();
        if (!isCustomProcess) {
            intervalId = setInterval(updateState, 100);
        }
    });

    onDestroy(() => {
        clearInterval(intervalId);
        cleanupCheats?.();
        unsubscribeCheats?.();
    });

    beforeUpdate(updateState);

    $: {
        const builtInProcess = processes.find((p) => p.id === processId);

        if (builtInProcess) {
            process = builtInProcess;
            isCustomProcess = Boolean(builtInProcess.custom);
        } else if (processData) {
            process = processData;
            isCustomProcess = true;
        } else {
            process = null;
            isCustomProcess = false;
        }

        if (process) {
            try {
                totalDurationSeconds = durationInSeconds(process.duration);
            } catch (error) {
                console.warn('Unable to calculate process duration:', error);
                totalDurationSeconds = 0;
            }
        } else {
            totalDurationSeconds = 0;
        }

        if (intervalId && isCustomProcess) {
            clearInterval(intervalId);
            intervalId = null;
        } else if (!intervalId && mounted && !isCustomProcess) {
            intervalId = setInterval(updateState, 100);
        }

        updateState();
    }

    $: showCheatAction =
        cheatsAvailable &&
        cheatsEnabled &&
        !isCustomProcess &&
        (state === ProcessStates.IN_PROGRESS || state === ProcessStates.PAUSED);
</script>

{#if mounted && process}
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

            {#if process.hardening}
                <p class="hardening" data-testid={`process-hardening-${process.id}`}>
                    {process.hardening.emoji} Score {process.hardening.score}/100 · Passes
                    {process.hardening.passes}
                </p>
            {/if}

            {#if isCustomProcess}
                <p class="custom-process-note">
                    Custom processes are displayed for reference and managed separately.
                </p>
            {:else if state === ProcessStates.NOT_STARTED}
                <Chip text="Start" onClick={onProcessStart} inverted={true} />
            {:else if state === ProcessStates.IN_PROGRESS}
                <Chip text="Cancel" onClick={onProcessCancel} inverted={true} />
                <Chip text="Pause" onClick={onProcessPause} inverted={true} />
                {#if showCheatAction}
                    <Chip
                        text="Instant finish"
                        onClick={onProcessFinishNow}
                        dataTestId="qa-instant-finish-chip"
                        inverted={true}
                    >
                        <span class="qa-label">QA</span>
                    </Chip>
                {/if}
                <ProgressBar startDate={processStartedAt} {totalDurationSeconds} />
                <RemainingTime
                    endDate={processStartedAt + totalDurationSeconds * 1000}
                    totalDurationInSeconds={totalDurationSeconds}
                />
            {:else if state === ProcessStates.PAUSED}
                <Chip text="Cancel" onClick={onProcessCancel} inverted={true} />
                <Chip text="Resume" onClick={onProcessResume} inverted={true} />
                {#if showCheatAction}
                    <Chip
                        text="Instant finish"
                        onClick={onProcessFinishNow}
                        dataTestId="qa-instant-finish-chip"
                        inverted={true}
                    >
                        <span class="qa-label">QA</span>
                    </Chip>
                {/if}
                <ProgressBar startDate={processStartedAt} {totalDurationSeconds} />
                <RemainingTime
                    endDate={processStartedAt + totalDurationSeconds * 1000}
                    totalDurationInSeconds={totalDurationSeconds}
                />
            {:else}
                <Chip text="Collect" onClick={onProcessComplete} inverted={true} />
            {/if}
        </div>
    </Chip>
{:else if mounted}
    <div class="process-error">Process details unavailable.</div>
{/if}

<style>
    .container {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .hardening {
        font-weight: 600;
        margin: 4px 0;
    }

    h3,
    h4,
    h6 {
        color: white;
        margin: 0px;
    }

    .custom-process-note {
        margin-top: 12px;
        color: #d0f0d0;
        font-size: 0.9rem;
    }

    .process-error {
        padding: 1rem;
        border-radius: 12px;
        border: 2px solid #007006;
        background: #2c5837;
        color: white;
        text-align: center;
    }

    .qa-label {
        background: #111827;
        color: #f9fafb;
        border: 1px dashed rgba(255, 255, 255, 0.6);
        border-radius: 999px;
        padding: 2px 8px;
        font-size: 0.75rem;
        margin-right: 6px;
        letter-spacing: 0.04em;
    }

    :global(button[data-testid='qa-instant-finish-chip']) {
        background: linear-gradient(120deg, #ecfeff, #fde68a);
        color: #1f2937;
        border: 1px dashed #f59e0b;
        box-shadow: 0 8px 18px rgba(245, 158, 11, 0.25);
    }

    :global(button[data-testid='qa-instant-finish-chip']:hover) {
        background: linear-gradient(120deg, #fef9c3, #ffedd5);
    }
</style>
