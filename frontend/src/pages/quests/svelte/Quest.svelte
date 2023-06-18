<script>
    export let quest;
</script>

<div class="container" class:quest>
    {#if quest}
        <div class="content">
            <img class="quest-img" src={quest.image} alt={quest.image} />
            <div class="content-text">
                <h3>{quest.title}</h3>
                <p>{quest.description}</p>
            </div>
        </div>
    {/if}
</div>

<style>
    .container {
        background-color: #68d46d;
        color: black;
        border-radius: 20px;
        margin: 5px;
        opacity: 0.8;
    }

    .container:hover, .container.quest {
        opacity: 1;
    }

    h3, p {
        margin: 0;
        padding: 10px;
    }

    .quest-img {
        width: 200px;
        height: 400px;
        border-radius: 20px;
        margin: -10px;
        object-fit: cover;
        border: 5px solid #68d46d;
    }

    .content {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 20px;
    }

    @media only screen and (max-width: 479px) {
        .content {
            flex-direction: column;
        }
        
        .quest-img {
            width: 105%;
            height: 105%;
        }
    }

    .content-text {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>
