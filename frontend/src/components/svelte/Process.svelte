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
    } from '../../utils/gameState/processes.js';
    import processes from '../../generated/processes.json';
    import { durationInSeconds } from '../../utils.js';
    import Chip from './Chip.svelte';
    import CompactItemList from './CompactItemList.svelte';
    import { getItemCounts } from '../../utils/gameState/inventory.js';
    import { getItemMetadata } from './compactItemListHelpers.js';
    import { initializeQaCheats, qaCheatsAvailability, qaCheatsEnabled } from '../../lib/qaCheats';

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
    let isPulsing = false;
    let rerunQueued = false;
    let pulseMessage = '';
    let pulseTargets = { requireItems: false, consumeItems: false };
    let queuedPulseData = null;
    let pulseTimeoutId;
    let requireItemsContainer;
    let consumeItemsContainer;
    const pulseDurationMs = 1000;

    const isFullyVisible = (element) => {
        if (!element) {
            return true;
        }

        const rect = element.getBoundingClientRect();
        const viewHeight = window.innerHeight || document.documentElement.clientHeight;
        const viewWidth = window.innerWidth || document.documentElement.clientWidth;

        return rect.top >= 0 && rect.left >= 0 && rect.bottom <= viewHeight && rect.right <= viewWidth;
    };

    const scrollToMissingTargets = (targets) => {
        const containers = [];
        if (targets.requireItems && requireItemsContainer) {
            containers.push(requireItemsContainer);
        }
        if (targets.consumeItems && consumeItemsContainer) {
            containers.push(consumeItemsContainer);
        }

        containers.forEach((container) => {
            if (!isFullyVisible(container) && typeof container.scrollIntoView === 'function') {
                container.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        });
    };

    const collectMissingItems = (itemList = []) => {
        if (!itemList.length) {
            return [];
        }

        const counts = getItemCounts(itemList);
        return itemList
            .filter((item) => (counts[item.id] ?? 0) < (item.count ?? 1))
            .map((item) => {
                const metadata = getItemMetadata(item);
                const requiredCount = item.count ?? 1;
                const currentCount = counts[item.id] ?? 0;
                return {
                    id: item.id,
                    name: metadata.name,
                    missing: Math.max(0, requiredCount - currentCount),
                };
            });
    };

    const buildMissingMessage = (missingItems) => {
        if (!missingItems.length) {
            return '';
        }

        const previewItems = missingItems.slice(0, 2).map((item) => `${item.name} (${item.missing})`);
        const suffix = missingItems.length > 2 ? ' …' : '';
        return `Missing requirements: ${previewItems.join(', ')}${suffix}`;
    };

    const startPulse = (pulseData) => {
        isPulsing = true;
        pulseTargets = pulseData.targets;
        pulseMessage = pulseData.message;
        scrollToMissingTargets(pulseData.targets);

        clearTimeout(pulseTimeoutId);
        pulseTimeoutId = setTimeout(() => {
            if (rerunQueued && queuedPulseData) {
                rerunQueued = false;
                const nextPulse = queuedPulseData;
                queuedPulseData = null;
                startPulse(nextPulse);
                return;
            }

            isPulsing = false;
            pulseTargets = { requireItems: false, consumeItems: false };
            pulseMessage = '';
        }, pulseDurationMs);
    };

    const triggerMissingPulse = (targets, missingItems) => {
        const pulseData = {
            targets,
            message: buildMissingMessage(missingItems),
        };

        if (isPulsing) {
            rerunQueued = true;
            queuedPulseData = pulseData;
            return;
        }

        startPulse(pulseData);
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

        if (!process) {
            return;
        }

        const missingRequireItems = collectMissingItems(process.requireItems ?? []);
        const missingConsumeItems = collectMissingItems(process.consumeItems ?? []);
        const missingItems = [...missingRequireItems, ...missingConsumeItems];

        if (missingItems.length > 0) {
            triggerMissingPulse(
                {
                    requireItems: missingRequireItems.length > 0,
                    consumeItems: missingConsumeItems.length > 0,
                },
                missingItems
            );
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
                <div
                    class="requirements-block"
                    class:pulse={isPulsing && pulseTargets.requireItems}
                    bind:this={requireItemsContainer}
                    data-testid="process-requires-items"
                >
                    <h6>Requires:</h6>
                    <CompactItemList itemList={process.requireItems} noRed={true} />
                </div>
            {/if}

            {#if process.consumeItems && process.consumeItems.length > 0}
                <div
                    class="requirements-block"
                    class:pulse={isPulsing && pulseTargets.consumeItems}
                    bind:this={consumeItemsContainer}
                    data-testid="process-consumes-items"
                >
                    <h6>Consumes:</h6>
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
                <div class="start-action">
                    <div
                        class="start-button"
                        class:buttonPulse={isPulsing}
                        data-testid="process-start-button"
                    >
                        <Chip text="Start" onClick={onProcessStart} inverted={true} />
                    </div>
                    {#if pulseMessage}
                        <p
                            class="start-error-message"
                            role="status"
                            aria-live="polite"
                            data-testid="process-start-error-message"
                        >
                            {pulseMessage}
                        </p>
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
    }

    .requirements-block {
        border-radius: 12px;
        padding: 6px 0;
        position: relative;
        --pulse-color: #f59e0b;
        box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
    }

    .requirements-block.pulse {
        animation: requirementsPulse 1s linear;
    }

    .start-action {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
    }

    .start-error-message {
        margin: 0;
        font-size: 0.9rem;
        color: #fef3c7;
        text-align: center;
    }

    :global(.start-button.buttonPulse button) {
        background-color: #f59e0b;
        color: #1f2937;
        opacity: 1;
    }

    :global(.start-button.buttonPulse button:hover) {
        opacity: 1;
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

    .process-error {
        padding: 1rem;
        border-radius: 12px;
        border: 2px solid #007006;
        background: #2c5837;
        color: white;
        text-align: center;
    }

    @keyframes requirementsPulse {
        0% {
            box-shadow: 0 0 0 1px rgba(245, 158, 11, 0);
        }
        25% {
            box-shadow: 0 0 0 1px rgba(245, 158, 11, 1);
        }
        50% {
            box-shadow: 0 0 0 1px rgba(245, 158, 11, 0);
        }
        75% {
            box-shadow: 0 0 0 1px rgba(245, 158, 11, 1);
        }
        100% {
            box-shadow: 0 0 0 1px rgba(245, 158, 11, 0);
        }
    }
</style>
