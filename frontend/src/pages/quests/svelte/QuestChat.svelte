<script>

    export let quest;

</script>

<div>
    {#if quest}
        <img src={quest.image} alt={quest.image} />
    {/if}
</div>