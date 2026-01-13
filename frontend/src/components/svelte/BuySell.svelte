<script>
    import Chip from './Chip.svelte';
    import CompactItemList from './CompactItemList.svelte';
    import items from '../../pages/inventory/json/items';
    import { getPriceStringComponents } from '../../utils';
    import { buyItems, sellItems, getSalesTaxPercentage } from '../../utils/gameState/inventory.js';

    export let itemId;
    export let gameState;
    export let itemData = null;

    const dUSDId = items.find((i) => i.name === 'dUSD').id;
    const dCarbonId = items.find((i) => i.name === 'dCarbon').id;

    const getItemById = (id) => items.find((item) => item.id === id);

    $: resolvedItem = itemData ?? getItemById(itemId);
    $: itemList = [
        {
            id: itemId,
            name: resolvedItem?.name,
            image: resolvedItem?.image,
        },
        { id: dUSDId },
    ];
    $: ({ price, symbol } = getPriceStringComponents(resolvedItem?.price));
    $: taxAmount = resolvedItem ? getSalesTaxPercentage() : 0;
    $: effectiveSellPrice = taxAmount > 0 ? price * (1 - taxAmount / 100) : price;

    let activeType = 'buy'; // 'buy' or 'sell'
    let quantity = 1;

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
        if (!resolvedItem || price === 0) {
            return;
        }
        const transactionItem = {
            ...resolvedItem,
            price: activeType === 'buy' ? price : effectiveSellPrice,
            symbol,
            quantity,
        };
        const transactionList = [transactionItem];

        if (activeType === 'buy') {
            buyItems(transactionList, gameState);
        } else {
            sellItems(transactionList, gameState);
        }
    }

    $: buyChipActive = activeType === 'buy';
    $: sellChipActive = activeType === 'sell';
    $: displaySellPriceInRed = sellChipActive && taxAmount > 0;
</script>

<Chip inverted={true} text="">
    {#if price === 0}
        <p>Not tradeable</p>
    {:else}
        <div class="buy-sell-wrapper vertical">
            <Chip text="">
                <CompactItemList {itemList} />
            </Chip>

            <div class="horizontal">
                <Chip text="Buy" inverted={!buyChipActive} onClick={() => handleTypeClick('buy')} />
                <Chip
                    text="Sell"
                    inverted={!sellChipActive}
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
                    onClick={handleTransactionClick}
                    priceInRed={displaySellPriceInRed}
                    red={sellChipActive}
                />
            </div>

            {#if sellChipActive && taxAmount > 0}
                <p class="tax-notice">
                    Note: There's a {taxAmount}% tax applied. Reduce the amount of
                    <a href="/docs/dCarbon">dCarbon</a> in your inventory:
                </p>

                <CompactItemList itemList={[{ id: dCarbonId }]} inverted={true} />
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
