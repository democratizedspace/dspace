<script>
    export let quest,
        compact = false;
</script>

<div class="container" class:quest data-testid="quest-tile">
    {#if quest}
        {#if compact}
            <div class="content">
                <img
                    class="quest-img quest-img-compact"
                    src={quest.image}
                    alt={`Quest artwork for ${quest.title}`}
                />
                <div class="content-text" data-testid="quest-tile-text">
                    <h3>{quest.title}</h3>
                </div>
            </div>
        {:else}
            <div class="content">
                <img class="quest-img" src={quest.image} alt={`Quest artwork for ${quest.title}`} />
                <div class="content-text" data-testid="quest-tile-text">
                    <h3>{quest.title}</h3>
                    <p>{quest.description}</p>
                </div>
            </div>
        {/if}
    {/if}
</div>

<style>
    .container {
        background-color: #68d46d;
        color: black;
        border-radius: 20px;
        margin: 5px;
        opacity: 0.8;
        max-width: 100%;
        overflow: hidden;
        box-sizing: border-box;
    }

    .container:hover,
    .container.quest {
        opacity: 1;
    }

    h3,
    p {
        margin: 0;
        padding: 10px;
    }

    .quest-img {
        flex: 0 0 200px;
        width: 200px;
        height: 400px;
        border-radius: 20px;
        margin: -10px;
        object-fit: cover;
        border: 5px solid #68d46d;
        box-sizing: border-box;
    }

    .quest-img-compact {
        width: 100px;
        height: 100px;
    }

    .content {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        gap: 0;
        min-width: 0;
    }

    @media only screen and (max-width: 640px) {
        .content {
            flex-direction: column;
        }

        .quest-img {
            width: 100%;
            height: auto;
            margin: 0;
        }
    }

    .content-text {
        flex: 1 1 auto;
        min-width: 180px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        padding: 16px 24px;
    }

    @media only screen and (max-width: 640px) {
        .content-text {
            padding: 12px 16px;
        }
    }

    .content-text h3,
    .content-text p {
        width: 100%;
        min-width: 0;
        overflow-wrap: anywhere;
        padding: 0;
    }
</style>
