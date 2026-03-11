<script>
    import { onDestroy, onMount } from 'svelte';
    import Chip from './Chip.svelte';
    import CompactItemList from './CompactItemList.svelte';
    import items from '../../pages/inventory/json/items';
    import { getPriceStringComponents } from '../../utils';
    import { buyItems, sellItems, getSalesTaxPercentage } from '../../utils/gameState/inventory.js';
    import { syncGameStateFromLocalIfStale } from '../../utils/gameState/common.js';
    import { db, ENTITY_TYPES } from '../../utils/customcontent.js';

    export let itemId;

    const dUSDId = items.find((i) => i.name === 'dUSD').id;
    const dCarbonId = items.find((i) => i.name === 'dCarbon').id;

    let itemList = [{ id: itemId }, { id: dUSDId }];

    let item = items.find((item) => item.id === itemId);
    let price = 0;
    let symbol = '';
    let taxAmount = 0;
    let effectiveSellPrice = 0;
    let isLoading = false;

    let activeType = 'buy'; // 'buy' or 'sell'
    let quantity = 1;
    let refreshIntervalId;
    let refreshTick = 0;

    function handleTypeClick(type) {
        activeType = type;
    }

    function handleQuantityInput(event) {
        const newQuantity = parseFloat(event.target.value);
        if (!isNaN(newQuantity) && newQuantity > 0) {
            quantity = newQuantity;
        } else {
            quantity = 1;
        }
    }

    function handleTransactionClick() {
        if (!item) {
            return;
        }
        const transactionItem = {
            ...item,
            price,
            symbol,
            quantity,
        };
        const transactionList = [transactionItem];

        if (activeType === 'buy') {
            buyItems(transactionList);
        } else {
            sellItems(transactionList);
        }
    }

    onMount(async () => {
        refreshIntervalId = setInterval(() => {
            syncGameStateFromLocalIfStale();
            refreshTick += 1;
        }, 3000);
        if (item) {
            return;
        }

        isLoading = true;
        try {
            const loadedItem = await db.get(ENTITY_TYPES.ITEM, itemId);
            item = loadedItem ?? null;
        } catch (error) {
            item = null;
            console.error('Failed to load item from IndexedDB in BuySell.svelte', {
                itemId,
                entityType: ENTITY_TYPES.ITEM,
                error,
            });
        } finally {
            isLoading = false;
        }
    });

    $: {
        if (item && refreshTick >= 0) {
            const components = getPriceStringComponents(item.price);
            price = components.price;
            symbol = components.symbol;
            taxAmount = getSalesTaxPercentage();
            effectiveSellPrice = taxAmount > 0 ? price * (1 - taxAmount / 100) : price;
        } else {
            price = 0;
            symbol = '';
            taxAmount = 0;
            effectiveSellPrice = 0;
        }
    }

    onDestroy(() => {
        clearInterval(refreshIntervalId);
    });

    $: buyChipActive = activeType === 'buy';
    $: sellChipActive = activeType === 'sell';
    $: displaySellPriceInRed = sellChipActive && taxAmount > 0;
</script>

<Chip inverted={false} text="" dataTestId="buy-sell-root">
    {#if isLoading}
        <p>Loading...</p>
    {:else if !item}
        <p>Item not found</p>
    {:else if price === 0}
        <p>Not tradeable</p>
    {:else}
        <div class="buy-sell-wrapper vertical">
            <CompactItemList {itemList} inverted={false} />

            <div class="horizontal">
                <Chip
                    text="Buy"
                    dataTestId="buy-toggle"
                    inverted={buyChipActive}
                    onClick={() => handleTypeClick('buy')}
                />
                <Chip
                    text="Sell"
                    dataTestId="sell-toggle"
                    inverted={sellChipActive}
                    onClick={() => handleTypeClick('sell')}
                />
            </div>

            <div class="horizontal">
                <label>
                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        on:input={handleQuantityInput}
                        class="quantity-input"
                    />
                </label>
                <Chip
                    text={buyChipActive
                        ? `Buy for ${quantity * price} ${symbol}`
                        : `Sell for ${quantity * effectiveSellPrice} ${symbol} (-${taxAmount}%)`}
                    dataTestId="transaction-cta"
                    onClick={handleTransactionClick}
                    inverted={true}
                    red={displaySellPriceInRed}
                />
            </div>

            {#if sellChipActive && taxAmount > 0}
                <p class="tax-notice">
                    Note: There's a {taxAmount}% tax applied. Reduce the amount of
                    <a href="/docs/dCarbon">dCarbon</a> in your inventory:
                </p>

                <CompactItemList itemList={[{ id: dCarbonId }]} inverted={false} />
            {/if}
        </div>
    {/if}
</Chip>

<style>
    input {
        width: 200px;
        border-radius: 20px;
        font-size: 1.5rem;
        padding: 10px;
    }

    .horizontal {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }

    .vertical {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
    }

    label {
        margin-right: 5px;
    }

    .tax-notice {
        color: red;
        margin-top: 10px;
    }
</style>
