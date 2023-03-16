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
    <div class="horizontal">
        <img alt={item.title} src={item.image} />
        <h4 class="name">{item.name}</h4>
    </div>
    <p>{truncateString(item.description)}</p>
    <p><strong>Count:</strong> 0</p>
    <p><strong>Price:</strong> 0 dUSD</p>
</div>

<style>
    img {
        /* small icon */
        width: 50px;
        height: 50px;
        border-radius: 20px;
        object-fit: cover;
        margin: 10px;
    }

    p {
        text-align: center;
        font-size: 0.8rem;
        margin: 0px;
    }

    .name {
        text-align: center;
    }

    .item {
        margin: 5px;
        border-radius: 10px;
        background-color: #68d46d;
        color: black;
        width: 100%;
        opacity: 0.8;
        padding: 10px;
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
        flex-wrap: wrap;
    }
  </style>
  