<script>
    import Process from '../../../components/svelte/Process.svelte';
    import processes from '../../../generated/processes.json';
    import items from '../../inventory/json/items';
    import { buyItems, getItemCount } from '../../../utils/gameState/inventory.js';
    import { getPriceStringComponents } from '../../../utils.js';
    import { getProcess } from '../../../utils/customcontent.js';
    import { onMount } from 'svelte';

    export let slug;

    let builtInProcess = processes.find((p) => p.id === slug);
    let processData = null;
    let displayProcess = builtInProcess;
    let disableBuy = true;
    let disableReason = 'No required items are missing.';
    let toastVisible = false;
    let toastMessage = '';

    const getPriceInfo = (item) => {
        const { price, symbol } = getPriceStringComponents(item?.price);
        if (!Number.isFinite(price) || price <= 0 || !symbol) {
            return null;
        }

        const currency = items.find((entry) => entry.name === symbol);
        if (!currency?.id) {
            return null;
        }

        return {
            unitPrice: price,
            currencyId: currency.id,
            currencySymbol: symbol,
        };
    };

    const getRequiredPurchaseCandidates = () => {
        if (!displayProcess?.requireItems?.length) {
            return {
                candidates: [],
                allSatisfied: true,
                hasNonBuyableMissingItems: false,
            };
        }

        let allSatisfied = true;
        let hasNonBuyableMissingItems = false;
        const candidates = displayProcess.requireItems.reduce((result, req) => {
            const neededCount = Math.max(0, Number(req?.count ?? 0) - getItemCount(req?.id));
            if (neededCount <= 0) {
                return result;
            }

            allSatisfied = false;
            const item = items.find((entry) => entry.id === req.id);
            const priceInfo = getPriceInfo(item);

            if (!priceInfo) {
                hasNonBuyableMissingItems = true;
                return result;
            }

            result.push({
                id: req.id,
                need: neededCount,
                unitPrice: priceInfo.unitPrice,
                currencyId: priceInfo.currencyId,
                currencySymbol: priceInfo.currencySymbol,
                totalCost: neededCount * priceInfo.unitPrice,
            });
            return result;
        }, []);

        candidates.sort((a, b) => a.totalCost - b.totalCost || a.id.localeCompare(b.id));
        return {
            candidates,
            allSatisfied,
            hasNonBuyableMissingItems,
        };
    };

    const getBuyPlan = () => {
        const { candidates, allSatisfied, hasNonBuyableMissingItems } = getRequiredPurchaseCandidates();
        if (!displayProcess?.requireItems?.length) {
            return {
                disabled: true,
                reason: 'No required items for this process.',
                purchases: [],
            };
        }

        if (allSatisfied) {
            return {
                disabled: true,
                reason: 'All required items are already available.',
                purchases: [],
            };
        }

        if (candidates.length === 0) {
            const reason = hasNonBuyableMissingItems
                ? 'No buyable required items are still needed.'
                : 'No required items are missing.';
            return {
                disabled: true,
                reason,
                purchases: [],
            };
        }

        const balances = new Map();
        const getBalance = (currencyId) => {
            if (!balances.has(currencyId)) {
                balances.set(currencyId, getItemCount(currencyId));
            }
            return balances.get(currencyId);
        };

        const purchases = [];
        candidates.forEach((candidate) => {
            const balance = getBalance(candidate.currencyId);
            const maxAffordable = Math.floor(balance / candidate.unitPrice);
            const quantity = Math.min(candidate.need, Math.max(0, maxAffordable));
            if (quantity <= 0) {
                return;
            }

            const spent = quantity * candidate.unitPrice;
            balances.set(candidate.currencyId, balance - spent);
            purchases.push({
                id: candidate.id,
                quantity,
                price: candidate.unitPrice,
                currencyId: candidate.currencyId,
            });
        });

        if (!purchases.length) {
            const neededSymbols = [...new Set(candidates.map((entry) => entry.currencySymbol))];
            const symbolText = neededSymbols.join(', ');
            return {
                disabled: true,
                reason: `Not enough ${symbolText} to buy missing required items.`,
                purchases: [],
            };
        }

        return {
            disabled: false,
            reason: '',
            purchases,
        };
    };

    const updateDisabled = () => {
        const { disabled, reason } = getBuyPlan();
        disableBuy = disabled;
        disableReason = reason;
    };

    const buyRequired = () => {
        if (!displayProcess) return;

        const { purchases } = getBuyPlan();
        const added = purchases.reduce((total, purchase) => total + purchase.quantity, 0);
        if (!added) {
            updateDisabled();
            return;
        }

        purchases.forEach((purchase) => buyItems([purchase]));
        if (added > 0) {
            toastMessage = `\u2713 Added ${added} items to inventory`;
            toastVisible = true;
            setTimeout(() => (toastVisible = false), 3000);
        }
        updateDisabled();
    };

    onMount(async () => {
        if (builtInProcess) {
            updateDisabled();
            return;
        }

        try {
            const customProcess = await getProcess(slug);
            if (customProcess) {
                processData = customProcess;
                displayProcess = customProcess;
            }
        } catch (error) {
            console.warn('Unable to load custom process:', error);
        } finally {
            updateDisabled();
        }
    });
</script>

<div class="process-view">
    <Process inverted={true} processId={slug} {processData} />
    <span title={disableBuy ? disableReason : ''}>
        <button
            class="primary"
            type="button"
            on:click={buyRequired}
            aria-disabled={disableBuy}
            aria-describedby={disableBuy ? 'buy-required-disabled-reason' : undefined}
            disabled={disableBuy}
        >
            Buy required items
        </button>
    </span>
    {#if disableBuy && disableReason}
        <p id="buy-required-disabled-reason" class="sr-only">{disableReason}</p>
    {/if}
    {#if toastVisible}
        <div class="toast" role="status" aria-live="polite">{toastMessage}</div>
    {/if}
</div>

<style>
    .primary {
        background-color: #2f5b2f;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        margin-top: 10px;
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
    .process-view {
        display: flex;
        flex-direction: column;
        align-items: center;
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
</style>
