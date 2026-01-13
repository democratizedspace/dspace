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
    let pulseTargets = { require: false, consume: false };
    let startFeedbackMessage = '';
    let pulseTimeoutId;
    let queuedPulseTargets = null;
    let queuedPulseMessage = '';
    let requiresContainer;
    let consumesContainer;

    // Slightly longer than the 1s CSS animation to avoid timing races.
    const pulseDurationMs = 1050;
    const updateIntervalMs = 100;

    // Collect item deficits for a specific requirement list.
    const getMissingEntries = (items) => {
        if (!Array.isArray(items) || items.length === 0) {
            return [];
        }

        const counts = getItemCounts(items);
        return items.reduce((missing, item) => {
            const itemId =
                typeof item?.id === 'string' && item.id.trim().length > 0 ? item.id : null;
            if (!itemId) {
                return missing;
            }
            const required = Number(item?.count ?? 0);
            if (!Number.isFinite(required) || required <= 0) {
                return missing;
            }

            const available = Number(counts[itemId] ?? 0);
            const deficit = Math.max(0, required - available);
            if (deficit > 0) {
                const metadata = getItemMetadata(item);
                missing.push({
                    id: itemId,
                    name: metadata.name,
                    missing: deficit,
                });
            }
            return missing;
        }, []);
    };

    // Merge entries by id; keep the largest deficit to match hasItems() semantics.
    const mergeMissingEntries = (entries) => {
        const merged = new Map();
        entries.forEach((entry) => {
            const current = merged.get(entry.id);
            if (current) {
                current.missing = Math.max(current.missing, entry.missing);
            } else {
                // Items with the same id should share metadata, so the first entry is sufficient.
                merged.set(entry.id, { ...entry });
            }
        });
        return Array.from(merged.values());
    };

    // Build a short, user-friendly warning message from missing entries.
    const buildMissingMessage = (entries) => {
        if (!entries.length) {
            return '';
        }

        const formatted = entries.map((entry) => `${entry.name} (${entry.missing})`);
        if (formatted.length <= 2) {
            return `Missing requirements: ${formatted.join(', ')}`;
        }

        const remainingCount = formatted.length - 2;
        const moreLabel = remainingCount === 1 ? 'more' : 'more items';
        return (
            `Missing requirements: ${formatted.slice(0, 2).join(', ')}` +
            ` and ${remainingCount} ${moreLabel}`
        );
    };

    // Determine missing entries, message, and which sections need highlighting.
    const getMissingRequirementInfo = () => {
        const missingRequires = getMissingEntries(process?.requireItems ?? []);
        const missingConsumes = getMissingEntries(process?.consumeItems ?? []);
        const combinedMissing = mergeMissingEntries([...missingRequires, ...missingConsumes]);
        return {
            missingEntries: combinedMissing,
            message: buildMissingMessage(combinedMissing),
            targets: {
                require: missingRequires.length > 0,
                consume: missingConsumes.length > 0,
            },
        };
    };

    // Check if an element is fully visible within the viewport.
    const isFullyVisible = (element) => {
        if (
            !element ||
            typeof element.getBoundingClientRect !== 'function' ||
            typeof window === 'undefined'
        ) {
            // If we cannot measure visibility, treat it as not visible so we can attempt a scroll.
            return false;
        }

        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= viewportHeight &&
            rect.right <= viewportWidth
        );
    };

    // Scroll the first missing requirements section into view if needed.
    const scrollMissingIntoView = (targets) => {
        if (typeof window === 'undefined') {
            return;
        }

        const candidates = [];
        if (targets.require && requiresContainer) {
            candidates.push(requiresContainer);
        }
        if (targets.consume && consumesContainer) {
            candidates.push(consumesContainer);
        }

        const target = candidates.find((candidate) => !isFullyVisible(candidate));
        if (target && typeof target.scrollIntoView === 'function') {
            try {
                target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } catch (error) {
                console.warn('Unable to scroll missing requirements into view:', error);
            }
        }
    };

    // Start the missing-requirements pulse sequence and manage queued reruns.
    const beginPulse = (targets, message) => {
        if (!targets.require && !targets.consume) {
            return;
        }

        clearTimeout(pulseTimeoutId);
        rerunQueued = false;
        queuedPulseTargets = null;
        queuedPulseMessage = '';
        isPulsing = true;
        pulseTargets = targets;
        startFeedbackMessage = message;
        scrollMissingIntoView(targets);

        pulseTimeoutId = setTimeout(() => {
            if (rerunQueued) {
                rerunQueued = false;
                const nextTargets = queuedPulseTargets ?? targets;
                const nextMessage = queuedPulseMessage || message;
                queuedPulseTargets = null;
                queuedPulseMessage = '';
                isPulsing = false;
                pulseTargets = { require: false, consume: false };
                beginPulse(nextTargets, nextMessage);
                return;
            }

            isPulsing = false;
            pulseTargets = { require: false, consume: false };
            startFeedbackMessage = '';
        }, pulseDurationMs);
    };

    const updateState = () => {
        if (!process) {
            state = ProcessStates.NOT_STARTED;
            processStartedAt = undefined;
            return;
        }

        const processState = getProcessState(processId);
        state = processState.state;
        processStartedAt = getProcessStartedAt(processId);
    };

    const onProcessStart = () => {
        const { missingEntries, targets, message } = getMissingRequirementInfo();
        if (missingEntries.length > 0) {
            if (isPulsing) {
                if (!rerunQueued) {
                    rerunQueued = true;
                    queuedPulseTargets = targets;
                    queuedPulseMessage = message;
                }
                // Once a rerun is queued, additional clicks during the same pulse are ignored.
                return;
            }

            beginPulse(targets, message);
            return;
        }

        clearInterval(intervalId);
        startProcess(processId, process);
        intervalId = setInterval(updateState, updateIntervalMs);
        updateState();
    };

    const onProcessCancel = () => {
        clearInterval(intervalId);
        cancelProcess(processId, process);
        updateState();
    };

    const onProcessComplete = () => {
        clearInterval(intervalId);
        finishProcess(processId, process);
        updateState();
    };

    const onProcessPause = () => {
        clearInterval(intervalId);
        pauseProcess(processId);
        updateState();
    };

    const onProcessResume = () => {
        resumeProcess(processId);
        intervalId = setInterval(updateState, updateIntervalMs);
        updateState();
    };

    const onProcessInstantFinish = () => {
        finishProcessNow(processId, process);
        clearInterval(intervalId);
        updateState();
    };

    onMount(() => {
        mounted = true;
        updateState();
        intervalId = setInterval(updateState, updateIntervalMs);

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
        requiresContainer = null;
        consumesContainer = null;
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

        if (processData) {
            process = processData;
        } else if (builtInProcess) {
            process = builtInProcess;
        } else {
            process = null;
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

        if (!intervalId && mounted) {
            intervalId = setInterval(updateState, updateIntervalMs);
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
                    class="requirements-group"
                    class:pulse={isPulsing && pulseTargets.require}
                    data-testid="process-requires"
                    bind:this={requiresContainer}
                >
                    <CompactItemList itemList={process.requireItems} noRed={true} />
                </div>
            {/if}

            {#if process.consumeItems && process.consumeItems.length > 0}
                <h6>Consumes:</h6>
                <div
                    class="requirements-group"
                    class:pulse={isPulsing && pulseTargets.consume}
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

            {#if state === ProcessStates.NOT_STARTED}
                <div
                    class="start-action"
                    class:pulse={isPulsing}
                    data-testid="process-start-action"
                >
                    <Chip
                        text="Start"
                        onClick={onProcessStart}
                        inverted={true}
                        dataTestId="process-start-button"
                    />
                </div>
                {#if startFeedbackMessage}
                    <p
                        class="start-feedback"
                        data-testid="process-start-feedback"
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {startFeedbackMessage}
                    </p>
                {/if}
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
        --process-warning-rgb: 245, 158, 11;
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


    .requirements-group {
        border-radius: 12px;
        padding: 6px;
    }

    .requirements-group.pulse {
        animation: requirements-pulse 1s linear;
        box-shadow: 0 0 0 1px rgba(var(--process-warning-rgb), 0);
    }

    .start-action.pulse > :global(nav) > :global(button) {
        background-color: rgb(var(--process-warning-rgb));
        color: #111827;
        opacity: 1;
    }

    .start-feedback {
        margin: 0;
        font-size: 0.9rem;
        color: #fff7ed;
        text-align: center;
    }

    .process-error {
        padding: 1rem;
        border-radius: 12px;
        border: 2px solid #007006;
        background: #2c5837;
        color: white;
        text-align: center;
    }

    @keyframes requirements-pulse {
        0% {
            box-shadow: 0 0 0 1px rgba(var(--process-warning-rgb), 0);
        }
        25% {
            box-shadow: 0 0 0 1px rgba(var(--process-warning-rgb), 1);
        }
        50% {
            box-shadow: 0 0 0 1px rgba(var(--process-warning-rgb), 0);
        }
        75% {
            box-shadow: 0 0 0 1px rgba(var(--process-warning-rgb), 1);
        }
        100% {
            box-shadow: 0 0 0 1px rgba(var(--process-warning-rgb), 0);
        }
    }
</style>
