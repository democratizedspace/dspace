<script>
  export let itemId;
  export let count;

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

<div class="item">
  <div class="item-image">
    <img alt={item.title} src={item.image} />
  </div>
  <div class="item-info">
    <h4 class="name">{item.name}</h4>
    <p class="description">{truncateString(item.description)}</p>
    <p><strong>Count:</strong> {count}</p>
    {#if item.price && item.price > 0}
      <p><strong>Price:</strong> {item.price} dUSD</p>
    {/if}
  </div>
</div>
  
  <style>
    .item {
      display: flex;
      flex-direction: row;
      align-items: center;
      background-color: #68d46d;
      color: black;
      border-radius: 10px;
      padding: 10px;
      margin: 5px;
      width: 100%;
      opacity: 0.8;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  
    .item:hover {
      opacity: 1;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
  
    .item-image {
      margin-right: 15px;
    }
  
    img {
      width: 50px;
      height: 50px;
      border-radius: 20px;
      object-fit: cover;
    }
  
    .item-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  
    .name {
      text-align: left;
      margin: 0;
    }
  
    .description {
      font-size: 0.8rem;
      text-align: left;
      margin: 5px 0;
    }
  
    p {
      text-align: left;
      font-size: 0.8rem;
      margin: 0px;
    }
  </style>
  