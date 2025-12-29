<script lang="ts">
    import { onMount, tick } from 'svelte';
    import type { QuestGraph, QuestNode } from '../../lib/quests/questGraph';

    export let graph: QuestGraph;

    const ROOT_KEY = 'welcome/howtodoquests.json';
    const byKey = graph?.byKey ?? {};

    const compareNodes = (a?: QuestNode, b?: QuestNode) => {
        if (!a || !b) return a ? -1 : b ? 1 : 0;
        const order: Array<keyof QuestNode> = ['group', 'title', 'canonicalKey'];
        for (const key of order) {
            if (a[key] < b[key]) return -1;
            if (a[key] > b[key]) return 1;
        }
        return 0;
    };

    const sortKeys = (keys: string[]) =>
        [...keys].sort((a, b) => compareNodes(byKey[a], byKey[b]));

    const resolveRoot = () => {
        if (byKey[ROOT_KEY]) return ROOT_KEY;
        if (Array.isArray(graph?.reachableFromRoot) && graph.reachableFromRoot.length > 0) {
            return graph.reachableFromRoot[0];
        }
        return graph?.nodes?.[0]?.canonicalKey ?? '';
    };

    let focusedKey = resolveRoot();
    let searchOpen = false;
    let searchQuery = '';
    let diagnosticsOpen = false;
    let parentCycleIndex = 0;
    let childCycleIndex = 0;
    let cards: Record<string, HTMLElement | null> = {};
    const resetCycles = () => {
        parentCycleIndex = 0;
        childCycleIndex = 0;
    };

    $: focusedNode = byKey[focusedKey];
    $: parentKeys = focusedNode ? sortKeys(focusedNode.requires ?? []) : [];
    $: childKeys = focusedKey ? sortKeys(graph?.requiredBy?.[focusedKey] ?? []) : [];
    $: depth = focusedKey ? graph?.depthByKey?.[focusedKey] ?? 0 : 0;
    $: depthKeys = sortKeys(
        (graph?.nodes ?? [])
            .filter((node) => graph?.depthByKey?.[node.canonicalKey] === depth)
            .map((node) => node.canonicalKey)
    );
    $: searchResults = searchQuery.trim()
        ? sortKeys(
              graph.nodes
                  .filter((node) => {
                      const query = searchQuery.toLowerCase();
                      return (
                          node.title.toLowerCase().includes(query) ||
                          node.canonicalKey.toLowerCase().includes(query)
                      );
                  })
                  .map((node) => node.canonicalKey)
          )
        : [];

    const setFocus = async (key: string | undefined, options: { resetCycles?: boolean } = {}) => {
        if (!key || !byKey[key]) return;
        focusedKey = key;
        if (options.resetCycles !== false) {
            resetCycles();
        }
        await tick();
        const card = cards[focusedKey];
        if (card?.scrollIntoView) {
            card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    };

    const moveWithinDepth = (delta: number) => {
        if (!depthKeys.length) return;
        const currentIndex = depthKeys.indexOf(focusedKey);
        const nextIndex =
            currentIndex === -1
                ? 0
                : Math.min(Math.max(currentIndex + delta, 0), depthKeys.length - 1);
        const nextKey = depthKeys[nextIndex];
        if (nextKey !== focusedKey) {
            setFocus(nextKey);
        }
    };

    const focusParent = (cycle = false) => {
        if (!parentKeys.length) return;
        const index = cycle ? parentCycleIndex % parentKeys.length : 0;
        parentCycleIndex = cycle ? (parentCycleIndex + 1) % parentKeys.length : 0;
        setFocus(parentKeys[index], { resetCycles: false });
    };

    const focusChild = (cycle = false) => {
        if (!childKeys.length) return;
        const index = cycle ? childCycleIndex % childKeys.length : 0;
        childCycleIndex = cycle ? (childCycleIndex + 1) % childKeys.length : 0;
        setFocus(childKeys[index], { resetCycles: false });
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.defaultPrevented) return;

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            searchOpen = true;
            return;
        }

        if (event.key === 'Escape') {
            if (searchOpen) {
                searchOpen = false;
                searchQuery = '';
                event.preventDefault();
            }
            return;
        }

        if (searchOpen) return;

        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                moveWithinDepth(-1);
                break;
            case 'ArrowRight':
                event.preventDefault();
                moveWithinDepth(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                focusParent(event.shiftKey);
                break;
            case 'ArrowDown':
                event.preventDefault();
                focusChild(event.shiftKey);
                break;
            default:
                break;
        }
    };

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
        setFocus(focusedKey);
        return () => {
            window.removeEventListener('keydown', handleKeydown);
        };
    });
</script>

<div class="visualizer">
    <div class="header">
        <div>
            <p class="eyebrow">Quest Graph (QA)</p>
            <h3>{focusedNode ? focusedNode.title : 'Quest graph'}</h3>
            {#if focusedNode}
                <p class="subtle">{focusedNode.canonicalKey}</p>
            {/if}
        </div>
        <div class="controls">
            <button class="pill" type="button" on:click={() => setFocus(resolveRoot())}>
                Root
            </button>
            <button class="pill" type="button" on:click={() => (searchOpen = true)}>
                Search
            </button>
            <button
                class="pill"
                type="button"
                on:click={() => (diagnosticsOpen = !diagnosticsOpen)}>
                {diagnosticsOpen ? 'Hide diagnostics' : 'Show diagnostics'}
            </button>
        </div>
    </div>

    <div class="shelves">
        <div class="shelf">
            <div class="shelf-label">Parents</div>
            <div class="cards">
                {#if parentKeys.length === 0}
                    <div class="empty">No parents</div>
                {:else}
                    {#each parentKeys as key}
                        {#if byKey[key]}
                            <button
                                class:focused={key === focusedKey}
                                class="card"
                                type="button"
                                on:click={() => setFocus(key)}
                                bind:this={cards[key]}>
                                <div class="title">{byKey[key].title}</div>
                                <div class="meta">
                                    <span class="badge">{byKey[key].group}</span>
                                    {#if (byKey[key].requires?.length ?? 0) > 1}
                                        <span class="badge subtle">multi-parent</span>
                                    {/if}
                                </div>
                            </button>
                        {/if}
                    {/each}
                {/if}
            </div>
        </div>

        <div class="shelf current">
            <div class="shelf-label">Current depth</div>
            <div class="cards">
                {#if depthKeys.length === 0}
                    <div class="empty">No quests at this depth</div>
                {:else}
                    {#each depthKeys as key}
                        {#if byKey[key]}
                            <button
                                class:focused={key === focusedKey}
                                class="card"
                                type="button"
                                on:click={() => setFocus(key)}
                                bind:this={cards[key]}>
                                <div class="title">{byKey[key].title}</div>
                                <div class="meta">
                                    <span class="badge">{byKey[key].group}</span>
                                    {#if key === resolveRoot()}
                                        <span class="badge accent">root</span>
                                    {/if}
                                    {#if (byKey[key].requires?.length ?? 0) > 1}
                                        <span class="badge subtle">multi-parent</span>
                                    {/if}
                                </div>
                            </button>
                        {/if}
                    {/each}
                {/if}
            </div>
        </div>

        <div class="shelf">
            <div class="shelf-label">Children</div>
            <div class="cards">
                {#if childKeys.length === 0}
                    <div class="empty">No children</div>
                {:else}
                    {#each childKeys as key}
                        {#if byKey[key]}
                            <button
                                class:focused={key === focusedKey}
                                class="card"
                                type="button"
                                on:click={() => setFocus(key)}
                                bind:this={cards[key]}>
                                <div class="title">{byKey[key].title}</div>
                                <div class="meta">
                                    <span class="badge">{byKey[key].group}</span>
                                    {#if (byKey[key].requires?.length ?? 0) > 1}
                                        <span class="badge subtle">multi-parent</span>
                                    {/if}
                                </div>
                            </button>
                        {/if}
                    {/each}
                {/if}
            </div>
        </div>
    </div>

    <div class="control-bar" aria-label="Navigator controls">
        <button type="button" on:click={() => moveWithinDepth(-1)} aria-label="Previous at depth">
            ◀
        </button>
        <button type="button" on:click={() => moveWithinDepth(1)} aria-label="Next at depth">
            ▶
        </button>
        <button type="button" on:click={() => focusParent(false)} aria-label="First parent">
            ▲
        </button>
        <button type="button" on:click={() => focusChild(false)} aria-label="First child">
            ▼
        </button>
        <button type="button" on:click={() => setFocus(resolveRoot())} aria-label="Go to root">
            Root
        </button>
        <button type="button" on:click={() => (searchOpen = true)} aria-label="Search">
            🔍
        </button>
    </div>

    <div class="diagnostics" data-open={diagnosticsOpen}>
        <button
            class="diagnostics-toggle"
            type="button"
            on:click={() => (diagnosticsOpen = !diagnosticsOpen)}>
            {diagnosticsOpen ? 'Hide diagnostics' : 'Show diagnostics'}
        </button>
        {#if diagnosticsOpen}
            <div class="diag-grid">
                <div>
                    <h4>Missing refs ({graph.diagnostics.missingRefs.length})</h4>
                    {#if graph.diagnostics.missingRefs.length === 0}
                        <p class="subtle">None</p>
                    {:else}
                        <ul>
                            {#each graph.diagnostics.missingRefs as issue}
                                <li>
                                    <button type="button" on:click={() => setFocus(issue.from)}>
                                        {issue.from} → {issue.ref}
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>
                <div>
                    <h4>Ambiguous refs ({graph.diagnostics.ambiguousRefs.length})</h4>
                    {#if graph.diagnostics.ambiguousRefs.length === 0}
                        <p class="subtle">None</p>
                    {:else}
                        <ul>
                            {#each graph.diagnostics.ambiguousRefs as issue}
                                <li>
                                    <button type="button" on:click={() => setFocus(issue.from)}>
                                        {issue.from} → {issue.ref} ({issue.candidates.length} candidates)
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>
                <div>
                    <h4>Unreachable ({graph.diagnostics.unreachableNodes.length})</h4>
                    {#if graph.diagnostics.unreachableNodes.length === 0}
                        <p class="subtle">None</p>
                    {:else}
                        <ul>
                            {#each graph.diagnostics.unreachableNodes as key}
                                <li>
                                    <button type="button" on:click={() => setFocus(key)}>{key}</button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>
                <div>
                    <h4>Cycles ({graph.diagnostics.cycles.length})</h4>
                    {#if graph.diagnostics.cycles.length === 0}
                        <p class="subtle">None</p>
                    {:else}
                        <ul>
                            {#each graph.diagnostics.cycles as cycle}
                                <li>
                                    <button type="button" on:click={() => setFocus(cycle[0])}>
                                        {cycle.join(' → ')}
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>
            </div>
        {/if}
    </div>

    {#if searchOpen}
        <div class="overlay" on:keydown|stopPropagation>
            <div class="search">
                <div class="search-header">
                    <input
                        type="text"
                        placeholder="Jump to quest"
                        bind:value={searchQuery}
                        autofocus
                    />
                    <button
                        type="button"
                        on:click={() => ((searchOpen = false), (searchQuery = ''))}>
                        Close
                    </button>
                </div>
                {#if searchResults.length === 0}
                    <p class="subtle">No results</p>
                {:else}
                    <ul>
                        {#each searchResults as key}
                            <li>
                                <button
                                    type="button"
                                    on:click={() => {
                                        setFocus(key);
                                        searchOpen = false;
                                        searchQuery = '';
                                    }}>
                                    {byKey[key]?.title ?? key}
                                    <span class="subtle">({key})</span>
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .visualizer {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 16px;
        padding: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        color: var(--color-heading);
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }

    .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.85rem;
        color: var(--color-pill-text);
        margin: 0 0 4px 0;
    }

    .subtle {
        color: var(--color-text);
        opacity: 0.8;
    }

    .controls {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
    }

    .pill {
        background: var(--color-pill);
        color: var(--color-pill-text);
        border: 1px solid var(--color-border);
        border-radius: 999px;
        padding: 6px 12px;
        cursor: pointer;
    }

    .shelves {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-top: 12px;
    }

    .shelf-label {
        font-size: 0.9rem;
        color: var(--color-text);
        margin-bottom: 6px;
    }

    .shelf {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        padding: 10px;
    }

    .cards {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(220px, 1fr);
        gap: 10px;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        padding-bottom: 6px;
    }

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
        transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
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

    .empty {
        color: var(--color-text);
        opacity: 0.7;
        padding: 8px;
    }

    .control-bar {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 8px;
        margin-top: 12px;
    }

    .control-bar button {
        background: var(--color-pill);
        color: var(--color-pill-text);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 8px;
        font-size: 1rem;
        cursor: pointer;
    }

    .diagnostics {
        margin-top: 12px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        padding: 10px;
    }

    .diagnostics-toggle {
        background: none;
        color: var(--color-heading);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
    }

    .diag-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
        margin-top: 10px;
    }

    .diag-grid ul {
        list-style: none;
        padding: 0;
        margin: 6px 0 0;
    }

    .diag-grid li button {
        background: none;
        border: none;
        color: var(--color-pill-text);
        text-align: left;
        padding: 6px 0;
        cursor: pointer;
        width: 100%;
    }

    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 30;
    }

    .search {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        padding: 16px;
        width: min(640px, 90vw);
        max-height: 80vh;
        overflow: auto;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }

    .search-header {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 10px;
    }

    .search input {
        flex: 1;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid var(--color-border);
        background: var(--color-bg);
        color: var(--color-heading);
    }

    .search button {
        background: var(--color-pill);
        color: var(--color-pill-text);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
    }

    .search ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .search li button {
        width: 100%;
        text-align: left;
        background: rgba(0, 0, 0, 0.1);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 10px;
        color: var(--color-heading);
        cursor: pointer;
    }

    @media (max-width: 720px) {
        .cards {
            grid-auto-columns: minmax(180px, 1fr);
        }
    }
</style>
