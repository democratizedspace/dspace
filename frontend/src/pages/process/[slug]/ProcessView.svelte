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
    let disabledReason = 'No required items are purchasable.';
    let toastVisible = false;
    let toastMessage = '';
    const disabledReasonId = 'buy-required-disabled-reason';

    const getUnitPrice = (item) => {
        const { price, symbol } = getPriceStringComponents(item?.price);
        if (!Number.isFinite(price) || price <= 0 || !symbol) {
            return null;
        }

        return {
            unitPrice: price,
            currencySymbol: symbol,
        };
    };

    const getCurrencyItem = (symbol) => items.find((item) => item.name === symbol);

    const getPendingBuyRequirements = () => {
        if (!displayProcess?.requireItems?.length) {
            return [];
        }

        return displayProcess.requireItems
            .map((req) => {
                const have = getItemCount(req.id);
                const neededQuantity = req.count - have;
                if (neededQuantity <= 0) {
                    return null;
                }

                const item = items.find((i) => i.id === req.id);
                const pricing = getUnitPrice(item);
                if (!pricing) {
                    return null;
                }

                const currencyItem = getCurrencyItem(pricing.currencySymbol);
                if (!currencyItem) {
                    return null;
                }

                return {
                    id: req.id,
                    quantity: neededQuantity,
                    unitPrice: pricing.unitPrice,
                    currencySymbol: pricing.currencySymbol,
                    currencyId: currencyItem.id,
                };
            })
            .filter(Boolean);
    };

    const getDisabledReason = () => {
        if (!displayProcess || !displayProcess.requireItems) {
            return 'No required items are purchasable.';
        }

        const missingRequirements = displayProcess.requireItems.filter(
            (req) => req.count - getItemCount(req.id) > 0
        );
        if (missingRequirements.length === 0) {
            return 'All required items are already available.';
        }

        const pendingBuys = getPendingBuyRequirements();
        if (pendingBuys.length === 0) {
            return 'No buyable required items are still needed.';
        }

        const availableByCurrency = pendingBuys.reduce((acc, requirement) => {
            if (acc[requirement.currencyId] != null) {
                return acc;
            }

            acc[requirement.currencyId] = getItemCount(requirement.currencyId);
            return acc;
        }, {});

        const sortedRequirements = [...pendingBuys].sort(
            (a, b) => a.unitPrice * a.quantity - b.unitPrice * b.quantity
        );
        const canBuyAtLeastOne = sortedRequirements.some((requirement) => {
            const balance = availableByCurrency[requirement.currencyId] ?? 0;
            const affordableQuantity = Math.floor(balance / requirement.unitPrice);
            if (affordableQuantity <= 0) {
                return false;
            }

            const purchasedQuantity = Math.min(requirement.quantity, affordableQuantity);
            availableByCurrency[requirement.currencyId] =
                balance - purchasedQuantity * requirement.unitPrice;

            return purchasedQuantity > 0;
        });

        if (!canBuyAtLeastOne) {
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

        const sortedRequirements = [...pendingBuys].sort(
            (a, b) => a.unitPrice * a.quantity - b.unitPrice * b.quantity
        );
        const remainingByCurrency = sortedRequirements.reduce((acc, requirement) => {
            if (acc[requirement.currencyId] == null) {
                acc[requirement.currencyId] = getItemCount(requirement.currencyId);
            }
            return acc;
        }, {});

        const purchasePlan = [];
        let added = 0;
        sortedRequirements.forEach((requirement) => {
            const balance = remainingByCurrency[requirement.currencyId] ?? 0;
            const affordableQuantity = Math.floor(balance / requirement.unitPrice);
            if (affordableQuantity <= 0) {
                return;
            }

            const quantity = Math.min(requirement.quantity, affordableQuantity);
            if (quantity <= 0) {
                return;
            }

            purchasePlan.push({
                id: requirement.id,
                quantity,
                price: requirement.unitPrice,
                currencyId: requirement.currencyId,
            });
            remainingByCurrency[requirement.currencyId] =
                balance - quantity * requirement.unitPrice;
            added += quantity;
        });

        if (purchasePlan.length === 0) {
            updateDisabled();
            return;
        }

        buyItems(purchasePlan);
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
    <div class="buy-required-wrapper" data-disabled={disableBuy ? 'true' : 'false'}>
        <button
            class="primary"
            type="button"
            on:click={buyRequired}
            aria-disabled={disableBuy}
            aria-describedby={disableBuy ? disabledReasonId : undefined}
            disabled={disableBuy}
        >
            Buy required items
        </button>
        {#if disableBuy}
            <span class="sr-only" id={disabledReasonId}>{disabledReason}</span>
            <span class="buy-required-tooltip" role="tooltip">
                {disabledReason}
            </span>
        {/if}
    </div>
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
    .buy-required-tooltip {
        position: absolute;
        top: calc(100% + 6px);
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: #fff;
        border-radius: 4px;
        padding: 6px 8px;
        font-size: 0.85rem;
        line-height: 1.2;
        width: max-content;
        max-width: min(320px, 80vw);
        text-align: center;
        z-index: 2;
        visibility: hidden;
        opacity: 0;
        transition: opacity 120ms ease-in-out;
    }
    .buy-required-wrapper[data-disabled='true']:hover .buy-required-tooltip {
        visibility: visible;
        opacity: 1;
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
