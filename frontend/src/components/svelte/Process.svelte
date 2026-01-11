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
        hasRequiredAndConsumedItems,
        getProcessState,
        ProcessStates,
        getProcessStartedAt,
    } from '../../utils/gameState/processes.js';
    import processes from '../../generated/processes.json';
    import items from '../../pages/inventory/json/items';
    import { durationInSeconds } from '../../utils.js';
    import Chip from './Chip.svelte';
    import CompactItemList from './CompactItemList.svelte';
    import { initializeQaCheats, qaCheatsAvailability, qaCheatsEnabled } from '../../lib/qaCheats';
    import { getItemCounts } from '../../utils/gameState/inventory.js';

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
    let pulseTargets = { requires: false, consumes: false };
    let missingMessage = '';
    let showMissingMessage = false;
    let pulseTimeoutId;
    let queuedPulseData = null;
    let requiresContainer;
    let consumesContainer;

    const PULSE_DURATION_MS = 1000;
    const PULSE_COLOR = '#a855f7';
    const PULSE_COLOR_RGB = '168, 85, 247';
    const itemNameLookup = new Map(items.map((item) => [item.id, item.name]));

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
            const missingTargets = getMissingTargets();
            queueMissingPulse(missingTargets);
            return;
        }

        clearMissingPulse();
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

    const getMissingItems = (itemList) => {
        if (!itemList || itemList.length === 0) {
            return [];
        }

        const counts = getItemCounts(itemList);
        return itemList
            .map((item) => {
                const requiredCount = Number(item.count);
                const normalizedRequiredCount = Number.isFinite(requiredCount)
                    ? requiredCount
                    : 0;
                const currentCount = counts[item.id] ?? 0;
                const missingCount = Math.max(0, normalizedRequiredCount - currentCount);
                return {
                    id: item.id,
                    name: itemNameLookup.get(item.id) ?? item.id,
                    missingCount,
                };
            })
            .filter((item) => item.missingCount > 0);
    };

    const summarizeMissingItems = (missingItems) => {
        if (missingItems.length === 0) {
            return '';
        }

        const formatted = missingItems.map((item) => `${item.name} (${item.missingCount})`);
        const preview = formatted.slice(0, 2);
        const suffix = formatted.length > 2 ? ' …' : '';
        return `Missing requirements: ${preview.join(', ')}${suffix}`;
    };

    const getMissingTargets = () => {
        const missingRequired = getMissingItems(process?.requireItems ?? []);
        const missingConsumed = getMissingItems(process?.consumeItems ?? []);
        const missingItems = [...missingRequired, ...missingConsumed];

        return {
            requires: missingRequired.length > 0,
            consumes: missingConsumed.length > 0,
            message: summarizeMissingItems(missingItems),
        };
    };

    const isFullyVisible = (element) => {
        const rect = element.getBoundingClientRect();
        const viewHeight = window.innerHeight || document.documentElement.clientHeight;
        return rect.top >= 0 && rect.bottom <= viewHeight;
    };

    const scrollTargetsIntoView = (targets) => {
        const elements = [];
        if (targets.requires && requiresContainer) {
            elements.push(requiresContainer);
        }
        if (targets.consumes && consumesContainer) {
            elements.push(consumesContainer);
        }

        elements.forEach((element) => {
            if (!isFullyVisible(element)) {
                element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        });
    };

    const startMissingPulse = (targets) => {
        if (!targets.requires && !targets.consumes) {
            return;
        }

        pulseTargets = { requires: targets.requires, consumes: targets.consumes };
        missingMessage = targets.message;
        showMissingMessage = Boolean(targets.message);
        isPulsing = true;
        scrollTargetsIntoView(targets);

        clearTimeout(pulseTimeoutId);
        pulseTimeoutId = setTimeout(() => {
            isPulsing = false;
            pulseTargets = { requires: false, consumes: false };

            if (rerunQueued && queuedPulseData) {
                rerunQueued = false;
                const nextPulse = queuedPulseData;
                queuedPulseData = null;
                startMissingPulse(nextPulse);
                return;
            }

            showMissingMessage = false;
            missingMessage = '';
        }, PULSE_DURATION_MS);
    };

    const queueMissingPulse = (targets) => {
        if (isPulsing) {
            if (!rerunQueued) {
                rerunQueued = true;
            }
            queuedPulseData = targets;
            return;
        }

        startMissingPulse(targets);
    };

    const clearMissingPulse = () => {
        clearTimeout(pulseTimeoutId);
        isPulsing = false;
        rerunQueued = false;
        queuedPulseData = null;
        pulseTargets = { requires: false, consumes: false };
        showMissingMessage = false;
        missingMessage = '';
    };
</script>

{#if mounted && process}
    <Chip text="">
        <div class="container">
            <h3>{process.title}</h3>

            {#if process.requireItems && process.requireItems.length > 0}
                <h6>Requires:</h6>
                <div
                    class="requirements-block"
                    class:pulse-border={isPulsing && pulseTargets.requires}
                    data-testid="process-requires"
                    bind:this={requiresContainer}
                    style={`--pulse-color: ${PULSE_COLOR}; --pulse-color-rgb: ${PULSE_COLOR_RGB}`}
                >
                    <CompactItemList itemList={process.requireItems} noRed={true} />
                </div>
            {/if}

            {#if process.consumeItems && process.consumeItems.length > 0}
                <h6>Consumes:</h6>
                <div
                    class="requirements-block"
                    class:pulse-border={isPulsing && pulseTargets.consumes}
                    data-testid="process-consumes"
                    bind:this={consumesContainer}
                    style={`--pulse-color: ${PULSE_COLOR}; --pulse-color-rgb: ${PULSE_COLOR_RGB}`}
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
                <div
                    class="start-button-wrapper"
                    class:pulse-button={isPulsing}
                    data-testid="process-start-wrapper"
                    style={`--pulse-color: ${PULSE_COLOR}; --pulse-color-rgb: ${PULSE_COLOR_RGB}`}
                >
                    <Chip text="Start" onClick={onProcessStart} inverted={true} />
                    {#if showMissingMessage}
                        <p
                            class="missing-message"
                            data-testid="process-missing-message"
                            role="status"
                            aria-live="polite"
                        >
                            {missingMessage}
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

    h3,
    h4,
    h6 {
        color: white;
        margin: 0px;
    }

    .requirements-block {
        border-radius: 12px;
    }

    .pulse-border {
        animation: missing-pulse 1s linear;
        box-shadow: 0 0 0 1px rgba(var(--pulse-color-rgb, 168, 85, 247), 0);
    }

    @keyframes missing-pulse {
        0% {
            box-shadow: 0 0 0 1px rgba(var(--pulse-color-rgb, 168, 85, 247), 0);
        }
        25% {
            box-shadow: 0 0 0 1px rgba(var(--pulse-color-rgb, 168, 85, 247), 1);
        }
        50% {
            box-shadow: 0 0 0 1px rgba(var(--pulse-color-rgb, 168, 85, 247), 0);
        }
        75% {
            box-shadow: 0 0 0 1px rgba(var(--pulse-color-rgb, 168, 85, 247), 1);
        }
        100% {
            box-shadow: 0 0 0 1px rgba(var(--pulse-color-rgb, 168, 85, 247), 0);
        }
    }

    .start-button-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
    }

    .start-button-wrapper.pulse-button :global(button) {
        background-color: var(--pulse-color, #a855f7);
        color: #fff;
        opacity: 1;
    }

    .missing-message {
        margin: 0;
        font-size: 0.85rem;
        color: #f5f3ff;
        text-align: center;
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
</style>
