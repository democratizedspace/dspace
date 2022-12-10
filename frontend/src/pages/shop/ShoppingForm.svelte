<script>
    import { getPriceStringComponents, getWalletBalance } from '../../utils.js';
    export let item, request, count = 1, shopAction = 'buy';

    if (item === undefined) {
        console.error(`Item with id ${item.id} not found`);
    }

    const name = item.name;

    const priceComponents = getPriceStringComponents(item.price);
    const symbol = priceComponents.symbol;
    const price = priceComponents.price;

    function generateBuyLink () {
        const totalPrice = parseFloat((price * count).toPrecision(4));
        let href;

        const existingBuyLink = document.getElementById('buylink-link');
        
        if (existingBuyLink !== null) {
            existingBuyLink.parentNode.removeChild(existingBuyLink);
        }

        const buyLink = document.createElement("a");
        
        switch (shopAction) {
            case 'buy':
                buyLink.innerHTML = `Buy ${count} ${name} for ${totalPrice} ${priceComponents.symbol}`;
                href = `/shop/buy/${item.id}/${count}`;
                break;
            case 'sell':
                buyLink.innerHTML = `Sell ${count} ${name} for ${totalPrice} ${priceComponents.symbol}`;
                href = `/shop/sell/${item.id}/${count}`;
                break;
            default:
                buyLink.innerHTML = `Buy ${count} ${name} for ${totalPrice} ${priceComponents.symbol}`;
                href = `/shop/buy/${item.id}/${count}`;
                break;
        }
        
        buyLink.setAttribute("href", href);
        
        buyLink.style.cssText = "color: white; background-color: green; text-decoration: none; padding: 10px; border-radius: 20px;";

        buyLink.className = "buylink";
        buyLink.id = "buylink-link";

        document.getElementById('buylink').append(buyLink);
    }
</script>

<div>
    <!-- A text input field that will be used to enter the number of items to purchase -->
    <input bind:value={count} class="num" type="number" id="quantity" min="1" />
    
    <p class="x">x</p>
    
    <img class="img" src={item.image} />

    <p class="price">You currently have: {0} {symbol}</p>
    <p class="price">Price per unit: {item.price}</p>
    <p class="price">Total price: {(parseFloat((count * priceComponents.price).toPrecision(4)))} {symbol}</p>

    <!-- A button that will be used to purchase the item -->
    <button class="buy" type="button" id="purchase" on:click={generateBuyLink}>Generate {shopAction === 'buy' ? "buy" : "sell"} link</button>

    <br /><br />

    <div id="buylink" />
</div>

<style>
	:root {
		--astro-gradient: linear-gradient(0deg, #2c5837, #00ff22);
		--link-gradient: linear-gradient(45deg, #003a03, #003a03 30%, var(--color-border) 60%);
        --form-width: 250px;
        --form-width-padding: 230px;
	}

    .x {
        font-size: 2rem;
        margin: 0 1rem;
        margin-left: 95px;
		background-image: var(--link-gradient);
		font-weight: 900;
		background-image: var(--astro-gradient);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-size: 100% 200%;
		background-position-y: 100%;
		border-radius: 0.4rem;
		animation: pulse 4s ease-in-out infinite;
    }

    .num {
        padding: 10px;
        font-size: xx-large;
        width: var(--form-width-padding);
    }

    input[type=number]::-webkit-inner-spin-button {
        opacity: 1;
    }

    .buy {
        font-size: large;
        padding: 10px;
        width: var(--form-width); 
    }

    .img {
        width: 200px;
        width: var(--form-width);
        border-radius: 20px;
    }

    button {
        border-radius: 20px;
    }

    input {
        border-radius: 20px;
    }
</style>