<script>
    import { afterUpdate } from 'svelte';

    export let items = [];
    export let onSelect = null;
    export let maxHeight = 320;
    export let itemHeight = 32;
    export let className = '';
    export let renderItem = null;

    let activeId;
    let container;
    let scrollTop = 0;

    $: if (activeId === undefined) {
        const first = items.find((i) => !i.disabled);
        activeId = first && first.id;
    }

    const virtualized = () => items.length * itemHeight > maxHeight;
    let start = 0;
    let end = items.length;

    $: if (virtualized()) {
        const perPage = Math.ceil(maxHeight / itemHeight);
        start = Math.floor(scrollTop / itemHeight);
        end = Math.min(items.length, start + perPage + 1);
    }

    function handleScroll() {
        scrollTop = container.scrollTop;
    }

    function setNextActive(delta) {
        if (!items.length) return;
        let idx = items.findIndex((i) => i.id === activeId);
        if (idx === -1) idx = 0;
        for (let i = 0; i < items.length; i++) {
            idx = (idx + delta + items.length) % items.length;
            if (!items[idx].disabled) {
                activeId = items[idx].id;
                break;
            }
        }
    }

    function handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setNextActive(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setNextActive(-1);
                break;
            case 'Enter':
            case ' ': {
                e.preventDefault();
                const item = items.find((i) => i.id === activeId);
                if (item && !item.disabled && onSelect) onSelect(item.id);
                break;
            }
        }
    }

    function handleClick(item) {
        if (item.disabled) return;
        activeId = item.id;
        if (onSelect) onSelect(item.id);
    }

    afterUpdate(() => {
        if (container && activeId !== undefined) {
            const el = container.querySelector(`[data-id="${activeId}"]`);
            if (el) el.focus();
        }
    });
</script>

<div
    role="listbox"
    bind:this={container}
    class={className}
    style="max-height:{maxHeight}px;overflow-y:auto;"
    tabindex="0"
    aria-activedescendant={activeId !== undefined ? `item-${activeId}` : undefined}
    on:keydown={handleKeyDown}
    on:scroll={virtualized() ? handleScroll : undefined}
    data-testid={virtualized() ? 'virtualized' : 'static'}
>
    {#if virtualized()}
        <div style="height:{items.length * itemHeight}px;position:relative;">
            <div style="position:absolute;top:{start * itemHeight}px;left:0;right:0;">
                {#each items.slice(start, end) as item (item.id)}
                    {#key item.id}
                        <div
                            role="option"
                            aria-selected={item.id === activeId}
                            tabindex={item.id === activeId ? 0 : -1}
                            data-id={item.id}
                            id={`item-${item.id}`}
                            style="display:flex;align-items:center;padding:4px;gap:8px;"
                            style:height={`${itemHeight}px`}
                            style:opacity={item.disabled ? 0.5 : 1}
                            style:cursor={item.disabled ? 'default' : 'pointer'}
                            style:outline={item.id === activeId ? '2px solid #2684FF' : null}
                            style:backgroundColor={item.id === activeId
                                ? 'rgba(38,132,255,0.1)'
                                : null}
                            on:click={() => handleClick(item)}
                            on:keydown={handleKeyDown}
                        >
                            {#if renderItem}
                                {@html renderItem(item)}
                            {:else}
                                {#if item.iconSrc}
                                    <img src={item.iconSrc} alt="" width="24" height="24" />
                                {/if}
                                <div style="display:flex;flex-direction:column;">
                                    <span>{item.label}</span>
                                    {#if item.subLabel}
                                        <span style="font-size:0.875em;color:#666"
                                            >{item.subLabel}</span
                                        >
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/key}
                {/each}
            </div>
        </div>
    {:else}
        {#each items as item (item.id)}
            {#key item.id}
                <div
                    role="option"
                    aria-selected={item.id === activeId}
                    tabindex={item.id === activeId ? 0 : -1}
                    data-id={item.id}
                    id={`item-${item.id}`}
                    style="display:flex;align-items:center;padding:4px;gap:8px;"
                    style:height={`${itemHeight}px`}
                    style:opacity={item.disabled ? 0.5 : 1}
                    style:cursor={item.disabled ? 'default' : 'pointer'}
                    style:outline={item.id === activeId ? '2px solid #2684FF' : null}
                    style:backgroundColor={item.id === activeId ? 'rgba(38,132,255,0.1)' : null}
                    on:click={() => handleClick(item)}
                    on:keydown={handleKeyDown}
                >
                    {#if renderItem}
                        {@html renderItem(item)}
                    {:else}
                        {#if item.iconSrc}
                            <img src={item.iconSrc} alt="" width="24" height="24" />
                        {/if}
                        <div style="display:flex;flex-direction:column;">
                            <span>{item.label}</span>
                            {#if item.subLabel}
                                <span style="font-size:0.875em;color:#666">{item.subLabel}</span>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/key}
        {/each}
    {/if}
</div>
