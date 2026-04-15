<script>
    import Process from '../../../components/svelte/Process.svelte';
    import processes from '../../../generated/processes.json';
    import items from '../../inventory/json/items';
    import { buyItems, getItemCount } from '../../../utils/gameState/inventory.js';
    import { getPriceStringComponents } from '../../../utils.js';
    import { getProcess } from '../../../utils/customcontent.js';
    import { onMount } from 'svelte';

    export let slug;

    const QUANTITY_PRECISION = 1_000_000;
    const CURRENCY_EPSILON = 1e-9;
    const defaultCurrencyItem = items.find((item) => item.name === 'dUSD') ?? null;

    let builtInProcess = processes.find((p) => p.id === slug);
    let processData = null;
    let displayProcess = builtInProcess;
    let disableBuy = true;
    let disabledReason = 'No required items are purchasable.';
    let toastVisible = false;
    let toastMessage = '';
    const disabledReasonId = `buy-required-disabled-reason-${slug}`;

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

    const getRequiredPurchaseItems = () => {
        if (!displayProcess) {
            return [];
        }

        const requiredCounts = new Map();
        const addCounts = (sourceItems = []) => {
            sourceItems.forEach((item) => {
                const id = item?.id;
                const count = Number(item?.count);
                if (!id || !Number.isFinite(count) || count <= 0) {
                    return;
                }

                requiredCounts.set(id, Math.max(requiredCounts.get(id) ?? 0, count));
            });
        };

        addCounts(displayProcess.requireItems);
        addCounts(displayProcess.consumeItems);

        return Array.from(requiredCounts.entries()).map(([id, count]) => ({ id, count }));
    };

    const getPendingBuyRequirements = () => {
        const requiredItems = getRequiredPurchaseItems();
        if (!requiredItems.length) {
            return [];
        }

        return requiredItems
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
        const requiredItems = getRequiredPurchaseItems();
        if (!requiredItems.length) {
            return 'No required items are purchasable.';
        }

        const missingRequirements = requiredItems.filter(
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

    const updateDisabled = () => {
        disabledReason = getDisabledReason();
        disableBuy = Boolean(disabledReason);
    };

    const buyRequired = () => {
        if (!displayProcess) return;

        const pendingBuys = getPendingBuyRequirements();
        if (pendingBuys.length === 0) {
            updateDisabled();
            return;
        }

        const { purchasePlan, added } = buildPurchasePlan(pendingBuys);
        if (purchasePlan.length === 0) {
            updateDisabled();
            return;
        }

        buyItems(purchasePlan);
        if (added > 0) {
            toastMessage = `✓ Added ${added} items to inventory`;
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
    <span class="buy-required-wrapper" title={disableBuy ? disabledReason : undefined}>
        <button
            class="primary"
            type="button"
            on:click={buyRequired}
            disabled={disableBuy}
            aria-describedby={disableBuy ? disabledReasonId : undefined}
        >
            Buy required items
        </button>
        {#if disableBuy}
            <span class="sr-only" id={disabledReasonId}>{disabledReason}</span>
        {/if}
    </span>
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
    .buy-required-wrapper {
        position: relative;
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
</style>
