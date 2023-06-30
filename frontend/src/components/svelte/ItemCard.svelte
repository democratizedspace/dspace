<script>
  import items from '../../pages/inventory/json/items.json';
  import { getItemCount } from '../../utils/gameState.js';
  
  export let itemId;
  export let count;

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
  <a href={`/inventory/item/${item.id}`}>
    <div class="horizontal">
      <div class="item-image">
        <img alt={item.title} src={item.image} />
      </div>
      <div class="vertical">
        <h4 class="name">{item.name}</h4>
        <p class="description">{truncateString(item.description)}</p>
        <p><strong>Count:</strong> {getItemCount(item.id)}</p>
        {#if item.price}
          <p><strong>Price:</strong> {item.price}</p>
        {/if}
      </div>
    </div>
  </a>
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
      width: 100px;
      height: 100px;
      border-radius: 20px;
      object-fit: cover;
    }

    .horizontal {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
    }
  
    .vertical {
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

    a {
      color: black;
      text-decoration: none;
      margin: 5px;
    }
  </style>
  