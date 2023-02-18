<script>
    export let itemId;

    import items from '../../pages/inventory/json/items.json';

    const item = items.find(item => item.id === itemId);

    function truncateString(str, length = 80) {
        if (str.length <= length) {
            return str;
        } else {
            return str.slice(0, length - 3) + '...';
        }
    }
</script>

<div class="vertical item">
    <img alt={item.title} src={item.image} />
    <h4 class="name">{item.name}</h4>
    <p class="description">{truncateString(item.description)}</p>
    <p><strong>Count:</strong> 0</p>
    <p><strong>Price:</strong> 0 dUSD</p>
</div>

<style>
    img {
        /* small icon */
        width: 100%;
        border-radius: 20px;
        /* nice green color for game rarity */
        border: 5px solid rgb(0, 89, 255);
    }

    p {
        text-align: center;
        font-size: 0.8rem;
        margin: 0px;
    }

    .name {
        min-height: 80px;
        text-align: center;
    }

    .description {
        min-height: 80px;
    }

    .item {
        margin: 5px;
        border-radius: 10px;
        background-color: #68d46d;
        color: black;
        width: 30%;
        opacity: 0.8;
        padding: 20px;
        padding-left: 10px;
        padding-top: 10px;
    }

    /* for mobile devices, make the description text smaller */
    @media only screen and (max-width: 600px) {
        .description {
            font-size: 0.6rem;
        }
    }

    .item:hover {
        opacity: 1;
        cursor: pointer;
    }

    .vertical {
        display: flex;
        flex-direction: column;
    }

    .horizontal {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
    }
  </style>
  