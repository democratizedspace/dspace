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
    let disableReason = 'No buyable required items are still needed.';
    let toastVisible = false;
    let toastMessage = '';

    const getUnitPrice = (item) => {
        const { price } = getPriceStringComponents(item?.price);
        return Number.isFinite(price) && price > 0 ? price : null;
    };

    const getCurrencyIdForSymbol = (symbol) => {
        if (!symbol) {
            return null;
        }

        const currencyItem = items.find((item) => item?.name === symbol || item?.id === symbol);
        return currencyItem?.id ?? null;
    };

    const getBuyPlan = () => {
        if (!displayProcess || !Array.isArray(displayProcess.requireItems)) {
            return {
                missingRequiredCount: 0,
                buyableRequirements: [],
            };
        }

        let missingRequiredCount = 0;
        const buyableRequirements = [];

        displayProcess.requireItems.forEach((req) => {
            const have = getItemCount(req.id);
            const need = req.count - have;
            if (need <= 0) {
                return;
            }

            missingRequiredCount += need;

            const item = items.find((i) => i.id === req.id);
            const unitPrice = getUnitPrice(item);
            if (unitPrice === null) {
                return;
            }

            const { symbol } = getPriceStringComponents(item?.price);
            const currencyId = getCurrencyIdForSymbol(symbol);
            if (!currencyId) {
                return;
            }

            const lineTotal = unitPrice * need;
            buyableRequirements.push({
                id: req.id,
                need,
                price: unitPrice,
                currencyId,
                lineTotal,
            });
        });

        return { missingRequiredCount, buyableRequirements };
    };

    const updateDisabled = () => {
        const { missingRequiredCount, buyableRequirements } = getBuyPlan();

        if (missingRequiredCount === 0) {
            disableBuy = true;
            disableReason = 'All required items are already available.';
            return;
        }

        if (buyableRequirements.length === 0) {
            disableBuy = true;
            disableReason = 'No buyable required items are still needed.';
            return;
        }

        const canBuyAnyRequirement = buyableRequirements.some((req) =>
            getItemCount(req.currencyId) >= req.price
        );

        if (!canBuyAnyRequirement) {
            disableBuy = true;
            disableReason = 'Not enough currency to buy any required items.';
            return;
        }

        disableBuy = false;
        disableReason = '';
    };

    const buyRequired = () => {
        if (!displayProcess) {
            return;
        }

        const { buyableRequirements } = getBuyPlan();
        if (buyableRequirements.length === 0) {
            updateDisabled();
            return;
        }

        const sortedByLineTotal = [...buyableRequirements].sort((a, b) => a.lineTotal - b.lineTotal);
        const remainingByCurrency = new Map();
        const transactions = [];
        let added = 0;

        sortedByLineTotal.forEach((req) => {
            const currentCurrencyBudget =
                remainingByCurrency.get(req.currencyId) ?? getItemCount(req.currencyId);
            const maxAffordableQty = Math.floor(currentCurrencyBudget / req.price);
            const quantityToBuy = Math.min(req.need, Math.max(0, maxAffordableQty));

            if (quantityToBuy > 0) {
                const spend = quantityToBuy * req.price;
                remainingByCurrency.set(req.currencyId, currentCurrencyBudget - spend);
                transactions.push({
                    id: req.id,
                    quantity: quantityToBuy,
                    price: req.price,
                    currencyId: req.currencyId,
                });
                added += quantityToBuy;
            }
        });

        if (transactions.length > 0) {
            buyItems(transactions);
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
    <span title={disableBuy && disableReason ? disableReason : undefined}>
        <button
            class="primary"
            type="button"
            on:click={buyRequired}
            aria-disabled={disableBuy}
            disabled={disableBuy}
            aria-describedby={disableBuy ? 'buy-required-reason' : undefined}
        >
            Buy required items
        </button>
    </span>
    {#if disableBuy && disableReason}
        <span id="buy-required-reason" class="sr-only">{disableReason}</span>
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
        clip: rect(0 0 0 0);
        height: 1px;
        margin: -1px;
        overflow: hidden;
        padding: 0;
        position: absolute;
        width: 1px;
        white-space: nowrap;
    }
</style>
