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
    let disableReason = 'No buyable required items remain.';
    let toastVisible = false;
    let toastMessage = '';

    const getUnitPriceAndSymbol = (item) => {
        const { price, symbol } = getPriceStringComponents(item?.price);
        if (!Number.isFinite(price) || price <= 0 || !symbol) {
            return { unitPrice: null, symbol: '' };
        }

        return { unitPrice: price, symbol };
    };

    const getCurrencyItemId = (symbol) => {
        if (!symbol) {
            return null;
        }

        const currencyItem = items.find((item) => item.symbol === symbol || item.name === symbol);
        return currencyItem?.id ?? null;
    };

    const getBuyPlan = () => {
        const requireItems = displayProcess?.requireItems ?? [];
        const missingRequirements = requireItems
            .map((req) => {
                const have = getItemCount(req.id);
                const need = req.count - have;
                const item = items.find((i) => i.id === req.id);
                const { unitPrice, symbol } = getUnitPriceAndSymbol(item);
                const currencyId = getCurrencyItemId(symbol);
                return {
                    id: req.id,
                    need,
                    unitPrice,
                    symbol,
                    currencyId,
                    totalCost: unitPrice === null ? Infinity : unitPrice * need,
                };
            })
            .filter((req) => req.need > 0 && req.unitPrice !== null && req.currencyId);

        const balancesByCurrency = new Map();
        missingRequirements.forEach((req) => {
            if (!balancesByCurrency.has(req.currencyId)) {
                balancesByCurrency.set(req.currencyId, getItemCount(req.currencyId));
            }
        });

        const plannedPurchases = [];
        missingRequirements
            .sort((a, b) => a.totalCost - b.totalCost)
            .forEach((req) => {
                const availableCurrency = balancesByCurrency.get(req.currencyId) ?? 0;
                const maxAffordableQty = availableCurrency / req.unitPrice;
                const quantity = Math.min(req.need, maxAffordableQty);
                if (quantity <= 0) {
                    return;
                }

                const totalCost = quantity * req.unitPrice;
                balancesByCurrency.set(req.currencyId, availableCurrency - totalCost);
                plannedPurchases.push({
                    id: req.id,
                    quantity,
                    price: req.unitPrice,
                    symbol: req.symbol,
                    currencyId: req.currencyId,
                });
            });

        return plannedPurchases;
    };

    const canBuyRequired = () => {
        if (!displayProcess?.requireItems?.length) {
            return false;
        }

        return true;
    };

    const updateDisabled = () => {
        if (!displayProcess || !displayProcess.requireItems) {
            disableBuy = true;
            disableReason = 'This process has no required items.';
            return;
        }

        const missingRequirements = displayProcess.requireItems.filter((req) => {
            const have = getItemCount(req.id);
            return req.count - have > 0;
        });

        if (missingRequirements.length === 0) {
            disableBuy = true;
            disableReason = 'All required items are already available.';
            return;
        }

        const hasBuyableMissingRequirements = missingRequirements.some((req) => {
            const item = items.find((i) => i.id === req.id);
            const { unitPrice, symbol } = getUnitPriceAndSymbol(item);
            return unitPrice !== null && getCurrencyItemId(symbol);
        });

        if (!hasBuyableMissingRequirements) {
            disableBuy = true;
            disableReason = 'No remaining required items can be bought.';
            return;
        }

        const buyPlan = getBuyPlan();
        disableBuy = buyPlan.length === 0;
        disableReason = disableBuy
            ? 'Not enough currency to buy any remaining required items.'
            : '';
    };

    const buyRequired = () => {
        if (!displayProcess) return;
        const buyPlan = getBuyPlan();
        const added = buyPlan.reduce((total, item) => total + item.quantity, 0);
        if (buyPlan.length > 0) {
            buyItems(buyPlan);
        }
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
    {#if canBuyRequired()}
        <button
            class="primary"
            type="button"
            on:click={buyRequired}
            aria-disabled={disableBuy}
            aria-describedby={disableBuy ? 'buy-required-reason' : undefined}
            title={disableBuy ? disableReason : ''}
            disabled={disableBuy}
        >
            Buy required items
        </button>
    {/if}
    {#if disableBuy}
        <p id="buy-required-reason" class="sr-only">{disableReason}</p>
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
        border: 0;
        clip: rect(0, 0, 0, 0);
        height: 1px;
        margin: -1px;
        overflow: hidden;
        padding: 0;
        position: absolute;
        width: 1px;
        white-space: nowrap;
    }
</style>
