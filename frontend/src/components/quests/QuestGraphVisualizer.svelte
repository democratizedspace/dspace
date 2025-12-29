<script lang="ts">
    import { onDestroy, onMount, tick } from 'svelte';
    import type { QuestGraph, QuestNode } from '../../lib/quests/questGraph';

    export let graph: QuestGraph;

    const comparatorKeys: Array<keyof QuestNode> = ['group', 'title', 'canonicalKey'];
    const compareNodes = (a?: QuestNode, b?: QuestNode): number => {
        if (!a || !b) return a ? -1 : b ? 1 : 0;

        for (const key of comparatorKeys) {
            if (a[key] < b[key]) return -1;
            if (a[key] > b[key]) return 1;
        }

        return 0;
    };

    const nodeLookup: Record<string, QuestNode> = graph?.byKey ?? {};
    const depthByKey: Record<string, number> = graph?.depthByKey ?? {};
    const requiredBy: Record<string, string[]> = graph?.requiredBy ?? {};
    const reachableSet = new Set(graph?.reachableFromRoot ?? []);
    const diagnostics = graph?.diagnostics ?? {
        ambiguousRefs: [],
        cycles: [],
        missingRefs: [],
        unreachableNodes: [],
    };

    const sortedNodes = [...(graph?.nodes ?? [])].sort(compareNodes);
    const depthBuckets = new Map<number, string[]>();
    for (const node of sortedNodes) {
        const depth = depthByKey[node.canonicalKey] ?? 0;
        const list = depthBuckets.get(depth) ?? [];
        list.push(node.canonicalKey);
        depthBuckets.set(depth, list);
    }

    const sortKeys = (keys: string[] = []) => {
        return keys
            .filter((key) => nodeLookup[key])
            .slice()
            .sort((a, b) => compareNodes(nodeLookup[a], nodeLookup[b]));
    };

    const rootKey = graph?.reachableFromRoot?.[0] ?? sortedNodes[0]?.canonicalKey ?? '';
    let focusedKey = rootKey;
    let parentCycleIndex = -1;
    let childCycleIndex = -1;
    let searchOpen = false;
    let searchQuery = '';
    let hydrated = false;
    let diagnosticsOpen = false;
    let container: HTMLDivElement | null = null;
    let searchInput: HTMLInputElement | null = null;

    const cardRefs = new Map<string, HTMLElement>();

    const registerCard = (node: HTMLElement, params: { key: string }) => {
        let currentKey = params.key;
        cardRefs.set(currentKey, node);
        return {
            update(newParams: { key: string }) {
                if (currentKey !== newParams.key) {
                    cardRefs.delete(currentKey);
                    currentKey = newParams.key;
                    cardRefs.set(currentKey, node);
                }
            },
            destroy() {
                cardRefs.delete(currentKey);
            },
        };
    };

    $: focusedNode = nodeLookup[focusedKey];
    $: parentKeys = sortKeys(focusedNode?.requires ?? []);
    $: childKeys = sortKeys(requiredBy[focusedKey] ?? []);
    $: currentDepth = depthByKey[focusedKey] ?? 0;
    $: depthKeys = depthBuckets.get(currentDepth) ?? [];
    $: if (focusedKey) {
        parentCycleIndex = -1;
        childCycleIndex = -1;
    }

    $: searchResults = (() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return sortedNodes;

        return sortedNodes.filter(
            (node) =>
                node.title.toLowerCase().includes(query) ||
                node.canonicalKey.toLowerCase().includes(query)
        );
    })();

    const scrollFocusedIntoView = () => {
        const target = cardRefs.get(focusedKey);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    };

    const focusKey = async (key: string | undefined) => {
        if (!key || !nodeLookup[key]) return;
        focusedKey = key;
        await tick();
        scrollFocusedIntoView();
    };

    const focusRoot = () => focusKey(rootKey);

    const moveWithinDepth = (direction: -1 | 1) => {
        if (!depthKeys.length) return;
        const currentIndex = depthKeys.indexOf(focusedKey);
        if (currentIndex === -1) {
            focusKey(depthKeys[0]);
            return;
        }
        const nextKey = depthKeys[currentIndex + direction];
        if (nextKey) {
            focusKey(nextKey);
        }
    };

    const focusParent = (cycle: boolean) => {
        if (!parentKeys.length) return;
        const index = cycle ? (parentCycleIndex + 1) % parentKeys.length : 0;
        parentCycleIndex = index;
        focusKey(parentKeys[index]);
    };

    const focusChild = (cycle: boolean) => {
        if (!childKeys.length) return;
        const index = cycle ? (childCycleIndex + 1) % childKeys.length : 0;
        childCycleIndex = index;
        focusKey(childKeys[index]);
    };

    const openSearch = async () => {
        searchOpen = true;
        searchQuery = '';
        await tick();
        searchInput?.focus();
    };

    const closeSearch = () => {
        searchOpen = false;
        searchQuery = '';
    };

    const handleSearchSubmit = (event: Event) => {
        event.preventDefault();
        if (!searchResults.length) return;
        focusKey(searchResults[0].canonicalKey);
        closeSearch();
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            if (searchOpen) {
                event.preventDefault();
                closeSearch();
            }
            return;
        }

        if (event.metaKey || event.ctrlKey) {
            if (event.key.toLowerCase() === 'k') {
                event.preventDefault();
                openSearch();
            }
            return;
        }

        if (searchOpen) return;

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            moveWithinDepth(-1);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            moveWithinDepth(1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            focusParent(event.shiftKey);
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            focusChild(event.shiftKey);
        }
    };

    const handleGlobalKeydown = (event: KeyboardEvent) => {
        if (event.metaKey || event.ctrlKey) {
            if (event.key.toLowerCase() === 'k') {
                event.preventDefault();
                openSearch();
            }
        }

        if (event.key === 'Escape' && searchOpen) {
            event.preventDefault();
            closeSearch();
        }
    };

    onMount(() => {
        hydrated = true;
        focusRoot();
        container?.focus();
        window.addEventListener('keydown', handleGlobalKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleGlobalKeydown);
    });

    const focusFromDiagnostics = (key: string) => {
        if (nodeLookup[key]) {
            focusKey(key);
        }
    };

    const renderCycleLabel = (cycle: string[]) => cycle.join(' → ');

    const totalDiagnostics =
        diagnostics.missingRefs.length +
        diagnostics.ambiguousRefs.length +
        diagnostics.unreachableNodes.length +
        diagnostics.cycles.length;
</script>

<div
    class="quest-graph-visualizer"
    data-hydrated={hydrated}
    tabindex="0"
    on:keydown={handleKeydown}
    bind:this={container}
>
    <div class="shelves">
        <div class="shelf">
            <div class="shelf-header">
                <h3>Parents</h3>
                <span class="count">{parentKeys.length}</span>
            </div>
            <div class="shelf-row" aria-label="Parent quests">
                {#if parentKeys.length === 0}
                    <div class="empty">No parents</div>
                {:else}
                    {#each parentKeys as key (key)}
                        {#if nodeLookup[key]}
                            <button
                                class="quest-card"
                                class:focused={key === focusedKey}
                                on:click={() => focusKey(key)}
                                use:registerCard={{ key }}
                            >
                                <div class="card-header">
                                    <span class="group">{nodeLookup[key].group}</span>
                                    {#if nodeLookup[key].requires.length > 1}
                                        <span class="badge">multi-parent</span>
                                    {/if}
                                </div>
                                <div class="card-body">
                                    <h4>{nodeLookup[key].title}</h4>
                                    <p class="key">{nodeLookup[key].basename}</p>
                                </div>
                            </button>
                        {/if}
                    {/each}
                {/if}
            </div>
        </div>

        <div class="shelf current">
            <div class="shelf-header">
                <h3>Current depth</h3>
                <span class="count">{depthKeys.length}</span>
            </div>
            <div class="shelf-row" aria-label="Current depth quests">
                {#if depthKeys.length === 0}
                    <div class="empty">No quests at this depth</div>
                {:else}
                    {#each depthKeys as key (key)}
                        {#if nodeLookup[key]}
                            <button
                                class="quest-card"
                                class:focused={key === focusedKey}
                                on:click={() => focusKey(key)}
                                use:registerCard={{ key }}
                            >
                                <div class="card-header">
                                    <span class="group">{nodeLookup[key].group}</span>
                                    {#if key === rootKey}
                                        <span class="badge accent">root</span>
                                    {/if}
                                    {#if nodeLookup[key].requires.length > 1}
                                        <span class="badge">multi-parent</span>
                                    {/if}
                                    {#if !reachableSet.has(key)}
                                        <span class="badge warning">unreachable</span>
                                    {/if}
                                </div>
                                <div class="card-body">
                                    <h4>{nodeLookup[key].title}</h4>
                                    <p class="key">{nodeLookup[key].basename}</p>
                                </div>
                            </button>
                        {/if}
                    {/each}
                {/if}
            </div>
        </div>

        <div class="shelf">
            <div class="shelf-header">
                <h3>Children</h3>
                <span class="count">{childKeys.length}</span>
            </div>
            <div class="shelf-row" aria-label="Child quests">
                {#if childKeys.length === 0}
                    <div class="empty">No children</div>
                {:else}
                    {#each childKeys as key (key)}
                        {#if nodeLookup[key]}
                            <button
                                class="quest-card"
                                class:focused={key === focusedKey}
                                on:click={() => focusKey(key)}
                                use:registerCard={{ key }}
                            >
                                <div class="card-header">
                                    <span class="group">{nodeLookup[key].group}</span>
                                    {#if nodeLookup[key].requires.length > 1}
                                        <span class="badge">multi-parent</span>
                                    {/if}
                                </div>
                                <div class="card-body">
                                    <h4>{nodeLookup[key].title}</h4>
                                    <p class="key">{nodeLookup[key].basename}</p>
                                </div>
                            </button>
                        {/if}
                    {/each}
                {/if}
            </div>
        </div>
    </div>

    <div class="control-bar">
        <button class="control" aria-label="Previous at depth" on:click={() => moveWithinDepth(-1)}>
            ◀
        </button>
        <button class="control" aria-label="Next at depth" on:click={() => moveWithinDepth(1)}>
            ▶
        </button>
        <button class="control" aria-label="Cycle parents" on:click={() => focusParent(true)}>
            ▲
        </button>
        <button class="control" aria-label="Cycle children" on:click={() => focusChild(true)}>
            ▼
        </button>
        <button class="control" aria-label="Jump to root" on:click={focusRoot}>
            Root
        </button>
        <button class="control" aria-label="Open search" on:click={openSearch}>
            🔍
        </button>
    </div>

    <div class="diagnostics">
        <button class="diagnostics-toggle" on:click={() => (diagnosticsOpen = !diagnosticsOpen)}>
            Diagnostics {totalDiagnostics > 0 ? `(${totalDiagnostics})` : ''}
            <span aria-hidden="true">{diagnosticsOpen ? '▲' : '▼'}</span>
        </button>
        {#if diagnosticsOpen}
            <div class="diagnostics-body">
                <div class="diag-section">
                    <h4>Missing references ({diagnostics.missingRefs.length})</h4>
                    {#if diagnostics.missingRefs.length === 0}
                        <p class="empty">None</p>
                    {:else}
                        <ul>
                            {#each diagnostics.missingRefs as item, index (index)}
                                <li>
                                    <button on:click={() => focusFromDiagnostics(item.from)}>
                                        {item.from} → {item.ref}
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>
                <div class="diag-section">
                    <h4>Ambiguous references ({diagnostics.ambiguousRefs.length})</h4>
                    {#if diagnostics.ambiguousRefs.length === 0}
                        <p class="empty">None</p>
                    {:else}
                        <ul>
                            {#each diagnostics.ambiguousRefs as item, index (index)}
                                <li>
                                    <button on:click={() => focusFromDiagnostics(item.from)}>
                                        {item.from} → {item.ref}
                                        ({item.candidates.length} candidates)
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>
                <div class="diag-section">
                    <h4>Unreachable ({diagnostics.unreachableNodes.length})</h4>
                    {#if diagnostics.unreachableNodes.length === 0}
                        <p class="empty">None</p>
                    {:else}
                        <ul>
                            {#each diagnostics.unreachableNodes as key, index (index)}
                                <li>
                                    <button on:click={() => focusFromDiagnostics(key)}>
                                        {key}
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>
                <div class="diag-section">
                    <h4>Cycles ({diagnostics.cycles.length})</h4>
                    {#if diagnostics.cycles.length === 0}
                        <p class="empty">None</p>
                    {:else}
                        <ul>
                            {#each diagnostics.cycles as cycle, index (index)}
                                <li>
                                    <button on:click={() => focusFromDiagnostics(cycle[0])}>
                                        {renderCycleLabel(cycle)}
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
        <div class="search-overlay" on:click={closeSearch}>
            <div class="search-panel" on:click|stopPropagation>
                <div class="search-header">
                    <h4>Jump to quest</h4>
                    <button class="close" on:click={closeSearch} aria-label="Close search">
                        ✕
                    </button>
                </div>
                <form on:submit={handleSearchSubmit}>
                    <input
                        type="text"
                        placeholder="Search by title or key"
                        bind:value={searchQuery}
                        bind:this={searchInput}
                    />
                </form>
                <div class="search-results">
                    {#if searchResults.length === 0}
                        <p class="empty">No matches</p>
                    {:else}
                        <ul>
                            {#each searchResults as node (node.canonicalKey)}
                                <li>
                                    <button
                                        on:click={() => {
                                            focusKey(node.canonicalKey);
                                            closeSearch();
                                        }}
                                    >
                                        <span class="title">{node.title}</span>
                                        <span class="hint">{node.canonicalKey}</span>
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .quest-graph-visualizer {
        margin: 2rem 0;
        padding: 1.5rem;
        border-radius: 16px;
        background: linear-gradient(
            135deg,
            rgba(104, 212, 109, 0.1),
            rgba(104, 212, 109, 0.25)
        );
        border: 2px solid rgba(104, 212, 109, 0.6);
        outline: none;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .quest-graph-visualizer:focus {
        box-shadow: 0 0 0 3px rgba(104, 212, 109, 0.6);
    }

    .shelves {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .shelf {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .shelf-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .shelf-header h3 {
        margin: 0;
        font-size: 1rem;
    }

    .count {
        background: rgba(0, 0, 0, 0.1);
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        font-size: 0.85rem;
    }

    .shelf-row {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(220px, 1fr);
        gap: 0.75rem;
        overflow-x: auto;
        padding-bottom: 0.25rem;
        scroll-snap-type: x mandatory;
    }

    .shelf-row::-webkit-scrollbar {
        height: 8px;
    }

    .shelf-row::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 999px;
    }

    .quest-card {
        background: white;
        color: black;
        border: 2px solid #68d46d;
        border-radius: 12px;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        scroll-snap-align: center;
        cursor: pointer;
        text-align: left;
    }

    .quest-card:hover {
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);
    }

    .quest-card.focused {
        border-color: #0e7a12;
        box-shadow:
            0 0 0 3px rgba(14, 122, 18, 0.3),
            0 10px 22px rgba(0, 0, 0, 0.2);
    }

    .card-header {
        display: flex;
        gap: 0.35rem;
        align-items: center;
        flex-wrap: wrap;
        font-size: 0.85rem;
    }

    .group {
        background: rgba(104, 212, 109, 0.2);
        padding: 0.1rem 0.5rem;
        border-radius: 8px;
        text-transform: lowercase;
    }

    .badge {
        background: rgba(0, 0, 0, 0.06);
        padding: 0.1rem 0.5rem;
        border-radius: 8px;
        font-size: 0.8rem;
        text-transform: lowercase;
    }

    .badge.accent {
        background: rgba(104, 212, 109, 0.2);
    }

    .badge.warning {
        background: rgba(255, 99, 71, 0.18);
        color: #a52a2a;
    }

    .card-body {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .card-body h4 {
        margin: 0;
        font-size: 1rem;
    }

    .card-body .key {
        margin: 0;
        color: #444;
        font-size: 0.85rem;
    }

    .empty {
        color: #444;
        padding: 0.5rem 0.75rem;
        font-size: 0.95rem;
    }

    .control-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: flex-start;
    }

    .control {
        border: 2px solid #68d46d;
        background: white;
        color: black;
        padding: 0.4rem 0.75rem;
        border-radius: 10px;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
    }

    .control:hover {
        background: rgba(104, 212, 109, 0.1);
    }

    .diagnostics {
        border-top: 1px solid rgba(0, 0, 0, 0.08);
        padding-top: 0.75rem;
    }

    .diagnostics-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border: none;
        background: none;
        cursor: pointer;
        font-weight: 600;
        padding: 0;
    }

    .diagnostics-body {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.75rem;
        margin-top: 0.75rem;
    }

    .diag-section h4 {
        margin: 0 0 0.25rem 0;
    }

    .diag-section ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    .diag-section button {
        width: 100%;
        text-align: left;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        padding: 0.35rem 0.5rem;
        background: white;
        cursor: pointer;
    }

    .diag-section button:hover {
        background: rgba(104, 212, 109, 0.08);
    }

    .search-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        padding: 1rem;
    }

    .search-panel {
        background: white;
        border-radius: 12px;
        padding: 1rem;
        max-width: 600px;
        width: min(600px, 100%);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .search-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .search-header h4 {
        margin: 0;
    }

    .search-header .close {
        border: none;
        background: none;
        font-size: 1.1rem;
        cursor: pointer;
    }

    input[type='text'] {
        width: 100%;
        padding: 0.6rem 0.75rem;
        border-radius: 8px;
        border: 1px solid rgba(0, 0, 0, 0.15);
    }

    .search-results ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        max-height: 320px;
        overflow-y: auto;
    }

    .search-results button {
        width: 100%;
        text-align: left;
        border: 1px solid rgba(0, 0, 0, 0.1);
        background: white;
        border-radius: 8px;
        padding: 0.35rem 0.5rem;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
    }

    .search-results button:hover {
        background: rgba(104, 212, 109, 0.08);
    }

    .search-results .title {
        font-weight: 600;
    }

    .search-results .hint {
        color: #555;
        font-size: 0.85rem;
    }

    @media (max-width: 640px) {
        .quest-card {
            min-width: 240px;
        }

        .control-bar {
            justify-content: space-between;
        }
    }
</style>
