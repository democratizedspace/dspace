<script>
    export let defaultPFPs;

    function chooseAvatar(url) {
        console.log(url);

        // remove the item with id "noneselected"
        let noneselected = document.getElementById("noneselected");
        
        if (noneselected) {
            noneselected.remove();
        }

        // add an image with the url to the "preview" div
        let preview = document.getElementById("preview");

        if (preview) {
            preview.innerHTML = "";
        }

        let img = document.createElement("img");
        img.src = url;
        img.className = "item";
        
        // style the image
        img.style.width = "100px";
        img.style.height = "100px";
        img.style.borderRadius = "50%";

        // center
        img.style.display = "flex";
        img.style.justifyContent = "center";
        img.style.alignItems = "center";

        preview.appendChild(img);
    }
</script>

<div class="vertical">
    <div class="horizontal">
        <div class="item horizontal" id="preview">
            <p id="noneselected">None selected</p>
        </div>
        <button class="item">Select</button>
    </div>
    <div class="horizontal">
        {#each defaultPFPs as pfp}
            <img class="item" src={pfp.default} alt="pfp" on:click={() => chooseAvatar(pfp.default)} />
        {/each}
    </div>
</div>

<style>
    .horizontal {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
    }

    .vertical {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        justify-content: center;
    }

    .item {
        width: 40%;
        margin: 10px;
        border-radius: 20px;
    }

    p {
        font-size: 20px;
        /* center in div */
        display: flex;
        justify-content: center;
        align-items: center;
    }

    button {
        width: 40%;
        margin: 10px;
        border-radius: 20px;
        height: 100px;
        font-size: 20px;
        background-color: #68d46d;
        opacity: 0.8;
    }

    button:hover {
        cursor: pointer;
        opacity: 1;
    }
</style>