<script>
    import Chip from './Chip.svelte';
    import CompactItemList from './CompactItemList.svelte';
    import items from '../../pages/inventory/json/items.json';
    import { getPriceStringComponents } from '../../utils';
    import { buyItems, sellItems } from '../../utils/gameState/inventory.js';

    export let itemId;
    export let gameState;

    const dUSDId = "24";

    let itemList = [
        { id: itemId },
        { id: dUSDId },
    ];
    
    const item = items.find(item => item.id === itemId);
    const { price, symbol } = getPriceStringComponents(item.price);

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
        const { price, symbol } = getPriceStringComponents(item.price);
        const transactionItem = { ...item, price, symbol, quantity }; // separate price and symbol properties
        const transactionList = [transactionItem];

        if (activeType === 'buy') {
            buyItems(transactionList);
        } else {
            sellItems(transactionList);
        }
    }

    $: buyChipActive = activeType === 'buy';
    $: sellChipActive = activeType === 'sell';

</script>

<Chip inverted={true} text="">
    {#if price === 0}
        <p>Not tradeable</p>
    {:else}
        <div class="buy-sell-wrapper vertical">
            <Chip text="">
                <CompactItemList itemList={itemList} />
            </Chip>
            <div class="horizontal">
                <Chip 
                    text="Buy" 
                    inverted={!buyChipActive} 
                    onClick={() => handleTypeClick('buy')}
                />
                <Chip 
                    text="Sell" 
                    inverted={!sellChipActive} 
                    onClick={() => handleTypeClick('sell')}
                />
            </div>

            <div class="horizontal">
                <label>
                    <input type="number" min="1" value={quantity} on:input={handleQuantityInput} class="quantity-input"/>
                </label>
                <Chip 
                    text={buyChipActive ? `Buy for ${price} ${symbol} each` : `Sell for ${price} ${symbol} each`}
                    onClick={handleTransactionClick}
                />
            </div>
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
</style>
