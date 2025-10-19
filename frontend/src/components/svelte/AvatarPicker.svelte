<script>
    import { onMount } from 'svelte';

    export let defaultPFPs;

    let selectedIndex = -1;
    let isHydrated = false;

    onMount(() => {
        isHydrated = true;
    });

    function setSelectedAvatar(index) {
        localStorage.setItem('avatarUrl', defaultPFPs[index]);
        if (typeof window !== 'undefined') {
            window.location.href = '/profile';
        }
    }

    function setHighlighted(index) {
        selectedIndex = index;
    }
</script>

<div class="vertical" data-testid="avatar-picker" data-hydrated={isHydrated ? 'true' : 'false'}>
    <div class="horizontal selector">
        <div class="item horizontal previewcontainer" id="preview">
            {#if selectedIndex >= 0}
                <img class="preview" src={defaultPFPs[selectedIndex]} alt="Selected Avatar" />
            {:else}
                <img class="preview hidden" alt="" />
            {/if}
        </div>
        <button
            class="item selectbutton"
            on:click={() => setSelectedAvatar(selectedIndex)}
            disabled={selectedIndex < 0}
            aria-disabled={selectedIndex < 0}
        >
            Select
        </button>
        Refresh the page to see more random avatars!
    </div>
    <div class="horizontal">
        {#each defaultPFPs as pfp, i}
            <button
                type="button"
                class="item-wrapper"
                class:highlighted={selectedIndex === i}
                id={`img-${i}`}
                on:click={() => setHighlighted(i)}
                aria-pressed={selectedIndex === i}
                aria-label={`Select avatar ${i + 1}`}
            >
                <img class="item" src={pfp} alt={`Avatar option ${i + 1}`} />
            </button>
        {/each}
    </div>
</div>

<style>
    .horizontal {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        align-items: flex-start;
    }

    .vertical {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        justify-content: center;
    }

    .item-wrapper {
        flex: 0 1 calc(50% - 10px);
        margin: 5px;
        border-radius: 20px;
        opacity: 0.8;
        border: 2px solid transparent;
        cursor: pointer;
    }

    .item-wrapper:focus-visible {
        outline: 2px solid #68d46d;
        outline-offset: 2px;
    }

    @media (min-width: 600px) {
        .item-wrapper {
            flex: 0 1 calc(25% - 10px);
        }
    }

    .item {
        width: 100%;
        border-radius: 20px;
    }

    .previewcontainer {
        margin: 0px;
        margin-left: 10px;
    }

    .preview {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        cursor: default;
    }

    .item-wrapper:hover {
        opacity: 1;
    }

    .highlighted {
        /* add a green border radius */
        border: 2px solid #68d46d;
    }

    button {
        width: 40%;
        margin: 10px;
        border-radius: 20px;
        height: 100px;
        font-size: 20px;
        background-color: #68d46d;
        opacity: 0.8;
        color: black;
    }

    button:hover {
        cursor: pointer;
        opacity: 1;
    }

    button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    .hidden {
        /* hide the element but still block out the space */
        visibility: hidden;
    }
</style>
