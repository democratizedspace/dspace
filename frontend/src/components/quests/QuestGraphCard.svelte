<script>
    import { createEventDispatcher } from 'svelte';

    const noop = () => ({});

    export let node;
    export let keyValue;
    export let isFocused = false;
    export let isRoot = false;
    export let isMultiParent = false;
    export let register = noop;

    const dispatch = createEventDispatcher();
</script>

<button
    class="card"
    class:focused={isFocused}
    aria-current={isFocused ? 'true' : undefined}
    type="button"
    on:click={() => dispatch('select', keyValue)}
    use:register={keyValue}
>
    <div class="title">{node.title}</div>
    <div class="meta">
        <span class="badge">{node.group}</span>
        {#if isRoot}
            <span class="badge accent">root</span>
        {/if}
        {#if isMultiParent}
            <span class="badge subtle">multi-parent</span>
        {/if}
    </div>
</button>

<style>
    .card {
        scroll-snap-align: start;
        text-align: left;
        background: var(--color-pill);
        color: var(--color-pill-text);
        border: 2px solid transparent;
        border-radius: 12px;
        padding: 12px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition:
            transform 120ms ease,
            box-shadow 120ms ease,
            border-color 120ms ease;
    }

    .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .card.focused {
        border-color: var(--color-pill-active);
        box-shadow: 0 0 0 3px rgba(104, 212, 109, 0.4);
    }

    .title {
        font-weight: 700;
        margin-bottom: 6px;
    }

    .meta {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        align-items: center;
    }

    .badge {
        background: var(--color-pill-active);
        color: var(--color-pill-active-text);
        border-radius: 8px;
        padding: 4px 8px;
        font-size: 0.8rem;
    }

    .badge.subtle {
        background: rgba(255, 255, 255, 0.15);
        color: var(--color-pill-text);
    }

    .badge.accent {
        border: 1px solid var(--color-border);
    }
</style>
