<script>
    import { createEventDispatcher } from 'svelte';

    export let href,
        text,
        onClick = undefined,
        disabled = false,
        inverted = false,
        red = false,
        hazard = false,
        cheat = false,
        pressed = undefined,
        dataTestId = undefined;

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
        <a {href} data-testid={dataTestId}>{text}</a>
    {:else}
        <button
            type="button"
            class:disabled={disabled === true}
            class:inverted={inverted === true}
            class:red={red === true}
            class:hazard={hazard === true}
            class:cheat={cheat === true}
            on:click={handleClick}
            {disabled}
            aria-disabled={disabled}
            aria-pressed={pressed}
            data-testid={dataTestId}
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

    .hazard:not(.disabled) {
        background-color: #9b1c31;
        color: white;
        opacity: 1;
    }

    .hazard:not(.disabled):hover {
        opacity: 0.9;
    }

    .inverted {
        background-color: #68d46d;
        color: black;
    }

    .cheat {
        background-color: transparent;
        border: 2px dashed #f97316;
        color: #f97316;
        box-shadow:
            0 0 0 1px rgba(249, 115, 22, 0.35),
            0 8px 16px rgba(0, 0, 0, 0.25);
        opacity: 1;
    }

    .cheat:not(.disabled):hover {
        background-color: rgba(249, 115, 22, 0.12);
        color: #fff7ed;
        border-color: #fb923c;
        box-shadow:
            0 0 0 1px rgba(251, 146, 60, 0.55),
            0 10px 18px rgba(0, 0, 0, 0.28);
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
