<script>
    import menu from '../../config/menu.json';
    import { getItemCount } from '../../utils/gameState/inventory.js';
    import { onMount } from 'svelte';
    import { isMenuItemActive } from './menuActive.js';

    export let pathname;

    let mounted = false;

    const toggleShowUnpinned = () => {
        showUnpinned = !showUnpinned;
    };

    const isActive = (item) => isMenuItemActive(pathname, item);

    const showMenuItem = (currentItem) => {
        if (currentItem && currentItem.hideIfOwned) {
            // for each item in hideIfOwned, check if the player has it
            for (const i of currentItem.hideIfOwned) {
                if (getItemCount(i.id) > 0) {
                    return false;
                }
            }
        }
        return true;
    };

    const LABEL_MORE = 'More';
    const LABEL_FEWER = 'Less';

    let showUnpinned = false;
    let toggleLabel = LABEL_MORE;

    $: toggleLabel = showUnpinned ? LABEL_FEWER : LABEL_MORE;

    // filter menu to only pinned == true
    const { pinned, unpinned } = menu.reduce(
        (acc, item) => {
            if (item.pinned) {
                acc.pinned.push(item);
            } else {
                acc.unpinned.push(item);
            }
            return acc;
        },
        { pinned: [], unpinned: [] }
    );

    const activeUnpinned = unpinned.filter((item) => isActive(item));
    if (activeUnpinned.length > 0) {
        const activeItem = activeUnpinned[0];
        unpinned.splice(unpinned.indexOf(activeItem), 1);
        pinned.push(activeItem);
    }

    onMount(() => {
        mounted = true;
    });
</script>

<nav data-testid="header-nav">
    {#each pinned as item}
        {#if isActive(item)}
            <a class="active" href={item.href} aria-current="page">{item.name}</a>
        {:else if item.hideIfOwned}
            {#if showMenuItem(item) && mounted}
                <a href={item.href}>{item.name}</a>
            {/if}
        {:else if item.comingSoon === true}
            <a class="disabled" href={item.href}>{item.name}</a>
        {:else}
            <a href={item.href}>{item.name}</a>
        {/if}
    {/each}

    <div
        id="unpinned-menu"
        hidden={!showUnpinned}
        style={`display: ${showUnpinned ? 'contents' : 'none'}`}
        aria-hidden={!showUnpinned}
        role="region"
        aria-label="Additional menu items"
    >
        {#each unpinned as item}
            {#if item.hideIfOwned}
                {#if mounted}
                    <button class="active" type="button">{item.name}</button>
                {/if}
            {:else if item.comingSoon === true}
                <button class="disabled" type="button">{item.name}</button>
            {:else}
                <a href={item.href}>{item.name}</a>
            {/if}
        {/each}
    </div>

    <button
        id="unpinned-toggle"
        on:click={toggleShowUnpinned}
        aria-expanded={showUnpinned}
        aria-controls="unpinned-menu"
        aria-label="Toggle additional menu items"
        type="button"
        data-hydrated={mounted ? 'true' : 'false'}
    >
        {toggleLabel}
    </button>
</nav>

<style>
    nav {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        width: min(
            70rem,
            calc(100% - (var(--header-inline-inset-left, 1rem) + var(--header-inline-inset-right, 1rem)))
        );
        max-width: min(
            70rem,
            calc(100% - (var(--header-inline-inset-left, 1rem) + var(--header-inline-inset-right, 1rem)))
        );
        margin-inline: auto;
        box-sizing: border-box;
        padding-inline: max(0.25rem, calc(var(--header-inline-inset-left, 1rem) / 3));
    }

    nav a {
        opacity: 0.8;
        background-color: var(--color-pill);
        border-radius: 0.4rem;
        color: var(--color-pill-text);
        text-decoration: none;
        flex-direction: row;
        margin: 1px;
        padding: 5px;
        text-align: center;
    }

    nav a:hover {
        opacity: 1;
    }

    nav a:focus-visible,
    nav button:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 2px;
    }

    nav button {
        background-color: var(--color-pill);
        border-radius: 0.4rem;
        color: var(--color-pill-text);
        text-decoration: none;
        flex-direction: row;
        margin: 1px;
        padding: 5px;
        text-align: center;
        font-size: 0.7rem;
        border: none;
        opacity: 0.8;
        font-family: system-ui, sans-serif;
        /* make the height less */
        height: 1.5rem;
        /* center in nav */
        align-self: center;
    }

    nav button:hover {
        opacity: 1;
        /* change cursor to pointer */
        cursor: pointer;
    }

    .active {
        background-color: var(--color-pill-active);
        color: var(--color-pill-active-text);
    }

    .disabled {
        background-color: #004603;
        color: rgb(138, 138, 138);
        font-size: 1rem;
        padding-left: 5px;
        padding-right: 5px;
        padding-top: 2px;
        padding-bottom: 10px;
    }

    .disabled:hover {
        /* make the cursor normal */
        cursor: default;
    }
</style>
