<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import CompactItemList from '../../../components/svelte/CompactItemList.svelte';

    const itemList = [
    ];

    const totalItemCount = itemList.reduce((acc, item) => acc + item.count, 0);

    const onSaveItems = () => {
        console.log('onSaveItems');
    };
</script>

<div class="outer">
    <div class="inner">
        <p align="center">{totalItemCount} {totalItemCount === 1 ? "item" : "items"} found</p>
        <CompactItemList {itemList} noRed={true} increase={true} />
    </div>
    <Chip text="Import items" inverted={true} disabled={true} onClick={onSaveItems} />
</div>

<style>
    .outer {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
    }

    p {
        max-width: 280px;;
        width: 100vh;
        font-weight: normal;
    }

    .inner {
        background-color: #68D46D;
        color: black;
        padding: 5px;
        margin: 20px;
        border-radius: 5px;
    }
</style>