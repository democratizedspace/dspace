<script>
    export let quest;

    const { title, description, image } = quest;
</script>

<div class="container">
    {#if quest}
        <div class="horizontal">
            <img src={image} alt={image} />
            <div class="vertical">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </div>
    {/if}
</div>

<style>
    .container {
        background-color: #68d46d;
        color: black;
        border-radius: 20px;
        margin: 20px;
        opacity: 0.8;
    }

    .container:hover {
        opacity: 1;
    }

    h3 {
        margin: 0;
        padding: 10px;
    }

    img {
        width: 200px;
        height: 400px;
        border-radius: 20px;
        margin: -10px;
        /* preserve aspect ratio */
        object-fit: cover;
        /* zoom out */

    }

    p {
        margin: 0;
        padding: 10px;
        
    }

    .horizontal {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 20px;
    }

    /* iphone 14  */
    @media only screen and (max-width: 479px) {
        .horizontal {
            flex-direction: column;
        }
        
        img {
            width: 105%;
            height: 105%;
        }
    }

    .vertical {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>