<script>
    import { createEventDispatcher } from 'svelte';

    export let href,
        text,
        onClick = undefined,
        disabled = false,
        inverted = false,
        red = false,
        pressed = undefined;

    const dispatch = createEventDispatcher();

    const handleClick = (event) => {
        if (typeof onClick === 'function') {
            onClick(event);
        }
        dispatch('click', event);
    };
</script>

<nav>
    {#if href}
        <a {href}>{text}</a>
    {:else}
        <button
            type="button"
            class:disabled={disabled === true}
            class:inverted={inverted === true}
            class:red={red === true}
            on:click={handleClick}
            {disabled}
            aria-disabled={disabled}
            aria-pressed={pressed}
        >
            <div class="slot">
                <slot />
            </div>
            <p>{text}</p>
        </button>
    {/if}
</nav>

<style>
    nav {
        text-align: center;
        display: inline-flex;
        flex-wrap: wrap;
        justify-content: center;
    }

    nav a,
    nav button {
        opacity: 0.8;
        background-color: #007006;
        border-radius: 0.4rem;
        color: white;
        text-decoration: none;
        flex-direction: row;
        margin: 1px;
        padding: 5px;
        text-align: center;
        -webkit-transition: 200ms linear;
        transition: 200ms linear;
    }

    nav button {
        border: none;
        padding: 6px 5px;
        font-size: 1em;
    }

    nav a:hover,
    nav button:hover {
        opacity: 1;
    }

    nav a:focus-visible,
    nav button:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 2px;
    }

    nav button:hover {
        cursor: pointer;
    }

    .red {
        color: rgb(255, 94, 0);
    }

    .inverted {
        background-color: #68d46d;
        color: black;
    }

    .disabled {
        background-color: #575f57;
        color: #8a8a8a;
        opacity: 1;
    }

    .disabled:hover {
        cursor: default;
    }

    p {
        margin: 0;
    }

    .slot {
        margin-right: 5px;
        /* text align left */
        display: flex;
        /* bold */
        font-weight: 1000;
    }
</style>
