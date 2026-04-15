<script>
    import Process from '../../../components/svelte/Process.svelte';
    import processes from '../../../generated/processes.json';
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

    /**
     * Returns the canonical requirement list for the "Buy required items" button.
     * Merges requireItems and consumeItems, deduping by item id and keeping the
     * higher count so buy/disable logic matches process start prerequisites.
     */
    const getProcessRequirements = () => {
        const requireItems = displayProcess?.requireItems ?? [];
        const consumeItems = displayProcess?.consumeItems ?? [];
        const mergedRequirements = new Map();

        [...requireItems, ...consumeItems].forEach((requirement) => {
            if (!requirement?.id) {
                return;
            }

            const normalizedCount = Number.isFinite(requirement.count) ? requirement.count : 0;
            const existingRequirement = mergedRequirements.get(requirement.id);

            if (!existingRequirement) {
                mergedRequirements.set(requirement.id, {
                    ...requirement,
                    count: normalizedCount,
                });
                return;
            }

            mergedRequirements.set(requirement.id, {
                ...existingRequirement,
                ...requirement,
                count: Math.max(existingRequirement.count, normalizedCount),
            });
        });

        return Array.from(mergedRequirements.values());
    };

    const getPendingBuyRequirements = () => {
        const requirements = getProcessRequirements();
        if (!requirements.length) {
            return [];
        }

        return requirements
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
        const requirements = getProcessRequirements();
        if (!requirements.length) {
            return 'No required items are purchasable.';
        }

        const missingRequirements = requirements.filter(
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
        if (builtInProcess) return;

        try {
            const customProcess = await getProcess(slug);
            if (customProcess) {
                processData = customProcess;
            }
        } catch (error) {
            console.warn('Unable to load custom process:', error);
        }
    });
</script>

<div class="process-view">
    <Process inverted={true} processId={slug} {processData} />
</div>

<style>
    .process-view {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>
 