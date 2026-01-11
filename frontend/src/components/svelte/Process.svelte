<script>
    import ProgressBar from './ProgressBar.svelte';
    import RemainingTime from './RemainingTime.svelte';
    import { beforeUpdate, onDestroy, onMount } from 'svelte';
    import {
        startProcess,
        cancelProcess,
        finishProcess,
        finishProcessNow,
        pauseProcess,
        resumeProcess,
        getProcessState,
        ProcessStates,
        getProcessStartedAt,
        hasRequiredAndConsumedItems,
    } from '../../utils/gameState/processes.js';
    import processes from '../../generated/processes.json';
    import { durationInSeconds } from '../../utils.js';
    import Chip from './Chip.svelte';
    import CompactItemList from './CompactItemList.svelte';
    import { initializeQaCheats, qaCheatsAvailability, qaCheatsEnabled } from '../../lib/qaCheats';
    import { getItemCount } from '../../utils/gameState/inventory.js';
    import items from '../../pages/inventory/json/items';

    export let processId;
    export let processData = null;

    let process;
    let isCustomProcess = false;
    let state = getProcessState(processId).state;
    let processStartedAt;
    let intervalId;
    let mounted = false;
    let totalDurationSeconds;
    let cheatsAvailable = false;
    let cheatsEnabled = false;
    let unsubscribeCheatsAvailability;
    let unsubscribeCheatsEnabled;
    let requiresContainer;
    let consumesContainer;
    let isPulsing = false;
    let rerunQueued = false;
    let pulseTargets = { requires: false, consumes: false };
    let pulseMessage = '';
    let queuedPulse = null;
    let pulseTimeoutId;
    const pulseDurationMs = 1000;

    const getMissingEntries = (list = []) =>
        list
            .map((entry) => {
                const missingCount = entry.count - getItemCount(entry.id);
                if (missingCount <= 0) {
                    return null;
                }
                const item = items.find((inventoryItem) => inventoryItem.id === entry.id);
                return {
                    id: entry.id,
                    name: item?.name ?? entry.id,
                    count: missingCount,
                };
            })
            .filter(Boolean);

    const formatMissingMessage = (missingItems) => {
        if (missingItems.length === 0) {
            return '';
        }
        const preview = missingItems
            .slice(0, 2)
            .map((item) => `${item.name} (${item.count})`)
            .join(', ');
        const suffix = missingItems.length > 2 ? ' \u2026' : '';
        return `Missing requirements: ${preview}${suffix}`;
    };

    const scrollIntoViewIfNeeded = (element) => {
        if (!element || typeof window === 'undefined') {
            return;
        }
        const rect = element.getBoundingClientRect();
        const fullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (!fullyVisible) {
            element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    };

    const runPulse = (targets, message) => {
        clearTimeout(pulseTimeoutId);
        pulseTargets = targets;
        pulseMessage = message;
        isPulsing = true;
        const scrollTargets = () => {
            if (targets.requires) {
                scrollIntoViewIfNeeded(requiresContainer);
            }
            if (targets.consumes) {
                scrollIntoViewIfNeeded(consumesContainer);
            }
        };
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(scrollTargets);
        } else {
            scrollTargets();
        }
        pulseTimeoutId = setTimeout(() => {
            isPulsing = false;
            pulseTargets = { requires: false, consumes: false };
            pulseMessage = '';
            if (rerunQueued && queuedPulse) {
                rerunQueued = false;
                const nextPulse = queuedPulse;
                queuedPulse = null;
                runPulse(nextPulse.targets, nextPulse.message);
            } else {
                rerunQueued = false;
                queuedPulse = null;
            }
        }, pulseDurationMs);
    };

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

        if (!hasRequiredAndConsumedItems(processId)) {
            const requiresMissing = getMissingEntries(process?.requireItems);
            const consumesMissing = getMissingEntries(process?.consumeItems);
            const targets = {
                requires: requiresMissing.length > 0,
                consumes: consumesMissing.length > 0,
            };
            const message = formatMissingMessage([...requiresMissing, ...consumesMissing]);
            if (isPulsing) {
                rerunQueued = true;
                queuedPulse = { targets, message };
            } else {
                runPulse(targets, message);
            }
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

    const onProcessInstantFinish = () => {
        if (isCustomProcess) {
            return;
        }

        finishProcessNow(processId);
        clearInterval(intervalId);
        updateState();
    };

    onMount(() => {
        mounted = true;
        updateState();
        if (!isCustomProcess) {
            intervalId = setInterval(updateState, 100);
        }

        initializeQaCheats();
        unsubscribeCheatsAvailability = qaCheatsAvailability.subscribe((available) => {
            cheatsAvailable = available;
        });
        unsubscribeCheatsEnabled = qaCheatsEnabled.subscribe((enabled) => {
            cheatsEnabled = enabled;
        });
    });

    onDestroy(() => {
        clearInterval(intervalId);
        clearTimeout(pulseTimeoutId);
        unsubscribeCheatsAvailability?.();
        unsubscribeCheatsEnabled?.();
    });

    beforeUpdate(updateState);

    $: canInstantFinish =
        cheatsAvailable &&
        cheatsEnabled &&
        (state === ProcessStates.IN_PROGRESS || state === ProcessStates.PAUSED);

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
</script>

{#if mounted && process}
    <Chip text="">
        <div class="container">
            <h3>{process.title}</h3>

            {#if process.requireItems && process.requireItems.length > 0}
                <h6>Requires:</h6>
                <div
                    class:requirements-pulse={isPulsing && pulseTargets.requires}
                    class="requirements-container"
                    data-testid="process-requires"
                    bind:this={requiresContainer}
                >
                    <CompactItemList itemList={process.requireItems} noRed={true} />
                </div>
            {/if}

            {#if process.consumeItems && process.consumeItems.length > 0}
                <h6>Consumes:</h6>
                <div
                    class:requirements-pulse={isPulsing && pulseTargets.consumes}
                    class="requirements-container"
                    data-testid="process-consumes"
                    bind:this={consumesContainer}
                >
                    <CompactItemList itemList={process.consumeItems} noRed={true} decrease={true} />
                </div>
            {/if}

            {#if process.createItems && process.createItems.length > 0}
                <h6>Creates:</h6>
                <CompactItemList itemList={process.createItems} noRed={true} increase={true} />
            {/if}

            <h4>Duration: {process.duration}</h4>

            {#if isCustomProcess}
                <p class="custom-process-note">
                    Custom processes are displayed for reference and managed separately.
                </p>
            {:else if state === ProcessStates.NOT_STARTED}
                <div class="start-action" class:start-pulse={isPulsing}>
                    <Chip
                        text="Start"
                        onClick={onProcessStart}
                        inverted={true}
                        className="start-button"
                        dataTestId="process-start"
                    />
                    {#if pulseMessage}
                        <div
                            class="pulse-message"
                            class:message-visible={isPulsing}
                            role="status"
                            aria-live="polite"
                        >
                            {pulseMessage}
                        </div>
                    {/if}
                </div>
            {:else if state === ProcessStates.IN_PROGRESS}
                <Chip text="Cancel" onClick={onProcessCancel} inverted={true} />
                <Chip text="Pause" onClick={onProcessPause} inverted={true} />
                {#if canInstantFinish}
                    <Chip
                        text="Instant finish"
                        onClick={onProcessInstantFinish}
                        cheat={true}
                        dataTestId="qa-instant-finish-chip"
                    >
                        <span class="qa-chip-label">
                            <span class="qa-chip-pill">QA</span>
                        </span>
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
                {#if canInstantFinish}
                    <Chip
                        text="Instant finish"
                        onClick={onProcessInstantFinish}
                        cheat={true}
                        dataTestId="qa-instant-finish-chip"
                    >
                        <span class="qa-chip-label">
                            <span class="qa-chip-pill">QA</span>
                        </span>
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
        --pulse-color: #f59e0b;
    }

    h3,
    h4,
    h6 {
        color: white;
        margin: 0px;
    }

    .qa-chip-label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 800;
        letter-spacing: 0.01em;
    }

    .qa-chip-pill {
        background: rgba(168, 85, 247, 0.18);
        border: 1px solid rgba(168, 85, 247, 0.55);
        color: #f5f3ff;
        border-radius: 10px;
        padding: 2px 7px;
        font-size: 0.75rem;
    }

    .custom-process-note {
        margin-top: 12px;
        color: #d0f0d0;
        font-size: 0.9rem;
    }

    .requirements-container {
        outline: 1px solid transparent;
        outline-offset: 2px;
        border-radius: 10px;
    }

    .requirements-pulse {
        animation: pulseBorder 1s linear;
    }

    .start-action {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
    }

    .pulse-message {
        font-size: 0.9rem;
        color: #fff7ed;
        opacity: 0;
        transition: opacity 150ms ease-in;
    }

    .message-visible {
        opacity: 1;
    }

    :global(.start-action.start-pulse .start-button) {
        background-color: var(--pulse-color);
        color: #1f2933;
    }

    .process-error {
        padding: 1rem;
        border-radius: 12px;
        border: 2px solid #007006;
        background: #2c5837;
        color: white;
        text-align: center;
    }

    @keyframes pulseBorder {
        0% {
            outline-color: transparent;
        }
        25% {
            outline-color: var(--pulse-color);
        }
        50% {
            outline-color: transparent;
        }
        75% {
            outline-color: var(--pulse-color);
        }
        100% {
            outline-color: transparent;
        }
    }
</style>
