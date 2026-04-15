<script>
    import ProgressBar from './ProgressBar.svelte';
    import RemainingTime from './RemainingTime.svelte';
    import { beforeUpdate, onDestroy, onMount } from 'svelte';
    import {
        startProcess,
        getItemCountOperationStartError,
        cancelProcess,
        finishProcess,
        finishProcessNow,
        pauseProcess,
        resumeProcess,
        getProcessState,
        ProcessStates,
        getProcessStartedAt,
        getRuntimeCreateItems,
    } from '../../utils/gameState/processes.js';
    import { syncGameStateFromLocalIfStale } from '../../utils/gameState/common.js';
    import processes from '../../generated/processes.json';
    import { durationInSeconds } from '../../utils.js';
    import items from '../../pages/inventory/json/items';
    import { getPriceStringComponents } from '../../utils.js';
    import Chip from './Chip.svelte';
    import CompactItemList from './CompactItemList.svelte';
    import { buyItems, getItemCount, getItemCounts } from '../../utils/gameState/inventory.js';
    import { getItemMetadata } from './compactItemListHelpers.js';
    import { getItemMap } from '../../utils/itemResolver.js';
    import { initializeQaCheats, qaCheatsAvailability, qaCheatsEnabled } from '../../lib/qaCheats';

    export let processId;
    export let processData = null;
    export let inverted = false;

    let process;
    let builtInProcess;
    let customProcess = null;
    let customProcessId = null;
    let customProcessAttemptedId = null;
    let customProcessRequest = null;
    let state = getProcessState(processId).state;
    let processStartedAt;
    let intervalId;
    let refreshIntervalId;
    let mounted = false;
    let totalDurationSeconds;
    let currentTime = Date.now();
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
    let runtimeCreateItems = [];
    let requiresContainer;
    let consumesContainer;
    let requirementItemMap = new Map();
    let requirementItemRequestId = 0;
    let previousRequirementKey = '';
    let disableBuyRequired = true;
    let disabledBuyRequiredReason = 'No required items are purchasable.';
    let buyRequiredToastVisible = false;
    let buyRequiredToastMessage = '';
    const disabledBuyRequiredReasonId = `buy-required-disabled-reason-${processId}`;
    const QUANTITY_PRECISION = 1_000_000;
    const CURRENCY_EPSILON = 1e-9;
    const defaultCurrencyItem = items.find((item) => item.name === 'dUSD') ?? null;

    // Slightly longer than the 1s CSS animation to avoid timing races.
    const pulseDurationMs = 1050;
    const updateIntervalMs = 100;
    const roundDownQuantity = (value) => {
        if (!Number.isFinite(value) || value <= 0) {
            return 0;
        }
        return Math.floor((value + CURRENCY_EPSILON) * QUANTITY_PRECISION) / QUANTITY_PRECISION;
    };
    const roundCurrency = (value) => {
        if (!Number.isFinite(value)) {
            return 0;
        }
        return Math.round(value * QUANTITY_PRECISION) / QUANTITY_PRECISION;
    };

    const getCurrencyItem = (symbol) => {
        if (!symbol) {
            return defaultCurrencyItem;
        }
        return items.find((item) => item.name === symbol) ?? defaultCurrencyItem;
    };

    const getUnitPrice = (item) => {
        const { price, symbol } = getPriceStringComponents(item?.price);
        if (!Number.isFinite(price) || price <= 0) {
            return null;
        }

        const currencyItem = getCurrencyItem(symbol);
        if (!currencyItem) {
            return null;
        }

        return {
            unitPrice: price,
            currencySymbol: symbol || defaultCurrencyItem?.name || 'dUSD',
            currencyId: currencyItem.id,
        };
    };

    const getPendingBuyRequirements = () => {
        if (!process?.requireItems?.length) {
            return [];
        }

        return process.requireItems
            .map((req) => {
                const have = getItemCount(req.id);
                const neededQuantity = roundDownQuantity(req.count - have);
                if (neededQuantity <= 0) {
                    return null;
                }

                const item = items.find((i) => i.id === req.id);
                const pricing = getUnitPrice(item);
                if (!pricing) {
                    return null;
                }

                return {
                    id: req.id,
                    quantity: neededQuantity,
                    unitPrice: pricing.unitPrice,
                    currencySymbol: pricing.currencySymbol,
                    currencyId: pricing.currencyId,
                };
            })
            .filter(Boolean);
    };

    const buildPurchasePlan = (pendingBuys) => {
        const sortedRequirements = [...pendingBuys].sort(
            (a, b) => a.unitPrice * a.quantity - b.unitPrice * b.quantity
        );
        const remainingByCurrency = sortedRequirements.reduce((acc, requirement) => {
            if (acc[requirement.currencyId] == null) {
                acc[requirement.currencyId] = roundCurrency(getItemCount(requirement.currencyId));
            }
            return acc;
        }, {});

        const purchasePlan = [];
        let added = 0;
        sortedRequirements.forEach((requirement) => {
            const balance = remainingByCurrency[requirement.currencyId] ?? 0;
            const affordableQuantity = roundDownQuantity(
                (balance + CURRENCY_EPSILON) / requirement.unitPrice
            );
            if (affordableQuantity <= 0) {
                return;
            }

            const quantity = roundDownQuantity(Math.min(requirement.quantity, affordableQuantity));
            if (quantity <= 0) {
                return;
            }

            const totalCost = roundCurrency(quantity * requirement.unitPrice);
            if (totalCost > balance + CURRENCY_EPSILON) {
                return;
            }

            purchasePlan.push({
                id: requirement.id,
                quantity,
                price: requirement.unitPrice,
                currencyId: requirement.currencyId,
            });
            remainingByCurrency[requirement.currencyId] = roundCurrency(balance - totalCost);
            added = roundDownQuantity(added + quantity);
        });

        return {
            purchasePlan,
            added,
        };
    };

    const getDisabledReason = () => {
        if (!process || !process.requireItems) {
            return 'No required items are purchasable.';
        }

        const missingRequirements = process.requireItems.filter(
            (req) => roundDownQuantity(req.count - getItemCount(req.id)) > 0
        );
        if (missingRequirements.length === 0) {
            return 'All required items are already available.';
        }

        const pendingBuys = getPendingBuyRequirements();
        if (pendingBuys.length === 0) {
            return 'Required items cannot be purchased.';
        }

        const { purchasePlan } = buildPurchasePlan(pendingBuys);
        if (purchasePlan.length === 0) {
            return 'Not enough currency to buy any still-needed required items.';
        }

        return '';
    };

    const updateBuyRequiredDisabledState = () => {
        disabledBuyRequiredReason = getDisabledReason();
        disableBuyRequired = Boolean(disabledBuyRequiredReason);
    };

    const buyRequiredItems = () => {
        if (!process) return;

        const pendingBuys = getPendingBuyRequirements();
        if (pendingBuys.length === 0) {
            updateBuyRequiredDisabledState();
            return;
        }

        const { purchasePlan, added } = buildPurchasePlan(pendingBuys);
        if (purchasePlan.length === 0) {
            updateBuyRequiredDisabledState();
            return;
        }

        buyItems(purchasePlan);
        if (added > 0) {
            buyRequiredToastMessage = `✓ Added ${added} items to inventory`;
            buyRequiredToastVisible = true;
            setTimeout(() => (buyRequiredToastVisible = false), 3000);
        }
        updateBuyRequiredDisabledState();
    };

    const releaseItemImages = (items) => {
        items.forEach((item) => item?.releaseImage?.());
    };

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
                const metadata = getItemMetadata(item, requirementItemMap);
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
            currentTime = Date.now();
            runtimeCreateItems = [];
            return;
        }

        const processState = getProcessState(processId);
        state = processState.state;
        processStartedAt = getProcessStartedAt(processId);

        if (state !== ProcessStates.PAUSED) {
            currentTime = Date.now();
        }

        runtimeCreateItems = getRuntimeCreateItems(processId, process);
    };

    const onProcessStart = async () => {
        const requirementItems = [
            ...(process?.requireItems ?? []),
            ...(process?.consumeItems ?? []),
        ];
        if (requirementItems.length > 0 && requirementItemMap.size === 0) {
            await loadRequirementItemMap(requirementItems);
        }

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
        const startError = getItemCountOperationStartError(processId, process);
        if (startError) {
            startFeedbackMessage = startError;
            return;
        }

        const started = startProcess(processId, process);
        if (!started) {
            startFeedbackMessage = 'Cannot start yet.';
            return;
        }
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

    const loadRequirementItemMap = async (items) => {
        const ids = items
            .map((item) =>
                typeof item?.id === 'string' || typeof item?.id === 'number'
                    ? String(item.id)
                    : null
            )
            .filter(Boolean);
        const requestId = ++requirementItemRequestId;
        const map = await getItemMap(ids);

        if (requestId !== requirementItemRequestId) {
            releaseItemImages(Array.from(map.values()));
            return;
        }

        releaseItemImages(Array.from(requirementItemMap.values()));
        requirementItemMap = map;
    };

    const loadCustomProcess = async (id) => {
        if (!id || customProcessRequest || customProcessAttemptedId === id) {
            return;
        }

        customProcessAttemptedId = id;
        customProcessRequest = (async () => {
            try {
                const { db, ENTITY_TYPES } = await import('../../utils/customcontent.js');
                const result = await db.get(ENTITY_TYPES.PROCESS, id);
                if (customProcessId === id) {
                    customProcess = result;
                }
            } catch (error) {
                if (customProcessId === id) {
                    customProcess = null;
                }
            } finally {
                if (customProcessId === id) {
                    customProcessRequest = null;
                }
            }
        })();

        await customProcessRequest;
    };

    onMount(() => {
        refreshIntervalId = setInterval(() => {
            syncGameStateFromLocalIfStale();
            updateState();
        }, 3000);
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
        clearInterval(refreshIntervalId);
        clearInterval(intervalId);
        clearTimeout(pulseTimeoutId);
        requiresContainer = null;
        consumesContainer = null;
        releaseItemImages(Array.from(requirementItemMap.values()));
        unsubscribeCheatsAvailability?.();
        unsubscribeCheatsEnabled?.();
    });

    beforeUpdate(updateState);

    $: if (processId !== customProcessId) {
        customProcessId = processId;
        customProcess = null;
        customProcessAttemptedId = null;
        customProcessRequest = null;
    }

    $: canInstantFinish =
        cheatsAvailable &&
        cheatsEnabled &&
        (state === ProcessStates.IN_PROGRESS || state === ProcessStates.PAUSED);

    $: builtInProcess = processes.find((p) => p.id === processId);

    $: if (mounted && processId && !processData && !builtInProcess) {
        void loadCustomProcess(processId);
    }

    $: {
        if (processData) {
            process = processData;
        } else if (builtInProcess) {
            process = builtInProcess;
        } else if (customProcess) {
            process = customProcess;
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

    $: if (mounted && process) {
        const requirementItems = [...(process.requireItems ?? []), ...(process.consumeItems ?? [])];
        const nextKey = requirementItems.map((item) => item?.id ?? '').join('|');
        if (nextKey !== previousRequirementKey) {
            previousRequirementKey = nextKey;
            void loadRequirementItemMap(requirementItems);
        }
    }

    $: if (mounted) {
        updateBuyRequiredDisabledState();
    }
</script>

{#if mounted && process}
    <Chip text="" {inverted} dataTestId="process-chip">
        <div class="container" class:container-inverted={inverted}>
            <h3>{process.title}</h3>

            {#if process.requireItems && process.requireItems.length > 0}
                <h6>Requires:</h6>
                <div
                    class="requirements-group"
                    class:pulse={isPulsing && pulseTargets.require}
                    data-testid="process-requires"
                    bind:this={requiresContainer}
                >
                    <CompactItemList itemList={process.requireItems} noRed={true} {inverted} />
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
                    <CompactItemList
                        itemList={process.consumeItems}
                        noRed={true}
                        decrease={true}
                        {inverted}
                    />
                </div>
            {/if}

            {#if runtimeCreateItems.length > 0}
                <h6>Creates:</h6>
                <div data-testid="process-creates">
                    <CompactItemList
                        itemList={runtimeCreateItems}
                        noRed={true}
                        increase={true}
                        {inverted}
                    />
                </div>
            {/if}

            <h4>Duration: {process.duration}</h4>

            {#if state === ProcessStates.NOT_STARTED}
                <span
                    class="buy-required-wrapper"
                    title={disableBuyRequired ? disabledBuyRequiredReason : undefined}
                >
                    <button
                        class="primary"
                        type="button"
                        on:click={buyRequiredItems}
                        disabled={disableBuyRequired}
                        aria-describedby={disableBuyRequired
                            ? disabledBuyRequiredReasonId
                            : undefined}
                    >
                        Buy required items
                    </button>
                    {#if disableBuyRequired}
                        <span class="sr-only" id={disabledBuyRequiredReasonId}>
                            {disabledBuyRequiredReason}
                        </span>
                    {/if}
                </span>
                <div
                    class="start-action"
                    class:pulse={isPulsing}
                    data-testid="process-start-action"
                >
                    <Chip
                        text="Start"
                        onClick={onProcessStart}
                        inverted={!inverted}
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
                <Chip text="Cancel" onClick={onProcessCancel} inverted={!inverted} />
                <Chip text="Pause" onClick={onProcessPause} inverted={!inverted} />
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
                <ProgressBar
                    startDate={processStartedAt}
                    {totalDurationSeconds}
                    {currentTime}
                    {inverted}
                />
                <RemainingTime
                    endDate={processStartedAt + totalDurationSeconds * 1000}
                    {currentTime}
                />
            {:else if state === ProcessStates.PAUSED}
                <Chip text="Cancel" onClick={onProcessCancel} inverted={!inverted} />
                <Chip text="Resume" onClick={onProcessResume} inverted={!inverted} />
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
                <ProgressBar
                    startDate={processStartedAt}
                    {totalDurationSeconds}
                    {currentTime}
                    {inverted}
                />
                <RemainingTime
                    endDate={processStartedAt + totalDurationSeconds * 1000}
                    {currentTime}
                />
            {:else}
                <Chip text="Collect" onClick={onProcessComplete} inverted={!inverted} />
            {/if}
        </div>
    </Chip>
    {#if buyRequiredToastVisible}
        <div class="toast" role="status" aria-live="polite">{buyRequiredToastMessage}</div>
    {/if}
{:else if mounted}
    <div class="process-error">Unknown process.</div>
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

    .container.container-inverted h3,
    .container.container-inverted h4,
    .container.container-inverted h6 {
        color: #111827;
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

    .buy-required-wrapper {
        position: relative;
        display: inline-block;
        align-self: center;
    }

    .primary {
        background-color: #2f5b2f;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        cursor: pointer;
    }

    .primary:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 2px;
    }

    .primary[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #cacaca;
        color: #fff;
        padding: 10px 20px;
        border-radius: 5px;
        text-align: center;
    }

    .container.container-inverted .start-feedback {
        color: #1f2937;
    }

    .deposit-input-label {
        color: #ffffff;
        font-size: 0.9rem;
    }

    .deposit-input {
        border: 1px solid rgba(255, 255, 255, 0.35);
        border-radius: 8px;
        background: rgba(17, 24, 39, 0.45);
        color: #ffffff;
        padding: 8px 10px;
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
