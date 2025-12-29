<script lang="ts">
    import { onDestroy, onMount, tick } from 'svelte';
    import type { QuestGraph, QuestNode } from '../../lib/quests/questGraph';

    export let graph: QuestGraph;

    const ROOT_KEY = 'welcome/howtodoquests.json';

    const compareNodes = (a?: QuestNode, b?: QuestNode) => {
        if (!a || !b) return a ? -1 : b ? 1 : 0;
        if (a.group !== b.group) return a.group < b.group ? -1 : 1;
        if (a.title !== b.title) return a.title < b.title ? -1 : 1;
        return a.canonicalKey < b.canonicalKey ? -1 : a.canonicalKey > b.canonicalKey ? 1 : 0;
    };

    const nodeFromKey = (key?: string): QuestNode | undefined => (key ? graph.byKey[key] : undefined);
    const depthOf = (key?: string) => (key ? graph.depthByKey[key] ?? 0 : 0);

    const sortedNodes = [...graph.nodes].sort(compareNodes);
    const rootKey = graph.byKey[ROOT_KEY] ? ROOT_KEY : sortedNodes[0]?.canonicalKey ?? '';

    let focusedKey = rootKey;
    let showDiagnostics = false;
    let showSearch = false;
    let searchQuery = '';
    let parentCycle = 0;
    let childCycle = 0;
    let searchInput: HTMLInputElement | null = null;
    let currentShelfContainer: HTMLDivElement | null = null;

    const focusNode = (key: string | undefined) => {
        if (!key || !graph.byKey[key]) return;
        focusedKey = key;
        parentCycle = 0;
        childCycle = 0;
        scrollFocusedIntoView();
    };

    const currentDepth = () => depthOf(focusedKey);

    const parents = () => {
        const node = nodeFromKey(focusedKey);
        if (!node) return [] as QuestNode[];
        return node.requires.map(nodeFromKey).filter(Boolean).sort(compareNodes) as QuestNode[];
    };

    const children = () => {
        const list = graph.requiredBy[focusedKey] ?? [];
        return list.map(nodeFromKey).filter(Boolean).sort(compareNodes) as QuestNode[];
    };

    const currentShelf = () =>
        sortedNodes
            .filter((node) => depthOf(node.canonicalKey) === currentDepth())
            .sort(compareNodes);

    const moveWithinShelf = (direction: -1 | 1) => {
        const shelf = currentShelf();
        const index = shelf.findIndex((node) => node.canonicalKey === focusedKey);
        if (index === -1) return;

        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= shelf.length) return;
        focusNode(shelf[nextIndex].canonicalKey);
    };

    const focusParent = (cycle = false) => {
        const list = parents();
        if (!list.length) return;
        if (!cycle) {
            parentCycle = 0;
            focusNode(list[0].canonicalKey);
            return;
        }

        parentCycle = (parentCycle + 1) % list.length;
        focusNode(list[parentCycle].canonicalKey);
    };

    const focusChild = (cycle = false) => {
        const list = children();
        if (!list.length) return;
        if (!cycle) {
            childCycle = 0;
            focusNode(list[0].canonicalKey);
            return;
        }

        childCycle = (childCycle + 1) % list.length;
        focusNode(list[childCycle].canonicalKey);
    };

    const clearSearch = () => {
        searchQuery = '';
        showSearch = false;
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.defaultPrevented) return;

        const isCmd = event.metaKey || event.ctrlKey;
        if (isCmd && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            showSearch = true;
            tick().then(() => searchInput?.focus());
            return;
        }

        if (event.key === 'Escape') {
            if (showSearch) {
                event.preventDefault();
                clearSearch();
            }
            return;
        }

        if (showSearch) return;

        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                moveWithinShelf(-1);
                break;
            case 'ArrowRight':
                event.preventDefault();
                moveWithinShelf(1);
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

    const scrollFocusedIntoView = async () => {
        await tick();
        if (!currentShelfContainer) return;
        const el = currentShelfContainer.querySelector(`[data-key="${focusedKey}"]`);
        if (el instanceof HTMLElement) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    };

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });

    const searchResults = () => {
        if (!searchQuery.trim()) return sortedNodes;
        const q = searchQuery.toLowerCase();
        return sortedNodes.filter(
            (node) =>
                node.title.toLowerCase().includes(q) ||
                node.group.toLowerCase().includes(q) ||
                node.canonicalKey.toLowerCase().includes(q)
        );
    };

    const formatList = (items: string[]) => items.join(', ');
</script>

<section class="quest-graph">
    <header class="quest-graph__header">
        <div>
            <h2>Quest Graph (QA)</h2>
            <p class="muted">
                Navigate quest dependencies with shelves, keyboard, or on-screen controls.
            </p>
        </div>
        <div class="header-actions">
            <button class="text-button" type="button" on:click={() => (showDiagnostics = !showDiagnostics)}>
                {showDiagnostics ? 'Hide diagnostics' : 'Show diagnostics'}
            </button>
            <button class="pill" type="button" on:click={() => (showSearch = true)}>
                Jump to quest (Ctrl/Cmd+K)
            </button>
        </div>
    </header>

    {#if showDiagnostics}
        <div class="diagnostics">
            <div class="diag-row">
                <div>
                    <strong>Missing refs</strong>
                    <span class="count-badge">{graph.diagnostics.missingRefs.length}</span>
                </div>
                {#if graph.diagnostics.missingRefs.length}
                    <ul>
                        {#each graph.diagnostics.missingRefs as item}
                            <li>
                                <button
                                    type="button"
                                    on:click={() => focusNode(item.from)}
                                    class="link-button"
                                >
                                    {item.from} → {item.ref}
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
            <div class="diag-row">
                <div>
                    <strong>Ambiguous refs</strong>
                    <span class="count-badge">{graph.diagnostics.ambiguousRefs.length}</span>
                </div>
                {#if graph.diagnostics.ambiguousRefs.length}
                    <ul>
                        {#each graph.diagnostics.ambiguousRefs as item}
                            <li>
                                <button
                                    type="button"
                                    on:click={() => focusNode(item.from)}
                                    class="link-button"
                                >
                                    {item.from} → {item.ref} ({formatList(item.candidates)})
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
            <div class="diag-row">
                <div>
                    <strong>Unreachable</strong>
                    <span class="count-badge">{graph.diagnostics.unreachableNodes.length}</span>
                </div>
                {#if graph.diagnostics.unreachableNodes.length}
                    <ul>
                        {#each graph.diagnostics.unreachableNodes as key}
                            <li>
                                <button type="button" on:click={() => focusNode(key)} class="link-button">
                                    {key}
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
            <div class="diag-row">
                <div>
                    <strong>Cycles</strong>
                    <span class="count-badge">{graph.diagnostics.cycles.length}</span>
                </div>
                {#if graph.diagnostics.cycles.length}
                    <ul>
                        {#each graph.diagnostics.cycles as cycle}
                            <li>
                                <button type="button" on:click={() => focusNode(cycle[0])} class="link-button">
                                    {formatList(cycle)}
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        </div>
    {/if}

    <div class="shelves">
        <div class="shelf">
            <div class="shelf-title">Parents</div>
            <div class="cards" data-shelf="parents">
                {#if parents().length === 0}
                    <p class="muted">None</p>
                {:else}
                    {#each parents() as node (node.canonicalKey)}
                        <button
                            type="button"
                            class="card"
                            data-key={node.canonicalKey}
                            on:click={() => focusNode(node.canonicalKey)}
                        >
                            <div class="card__header">
                                <span class="badge">{node.group}</span>
                                {#if node.canonicalKey === rootKey}
                                    <span class="badge badge--accent">Root</span>
                                {/if}
                                {#if graph.diagnostics.unreachableNodes.includes(node.canonicalKey)}
                                    <span class="badge badge--warn">Unreachable</span>
                                {/if}
                                {#if node.requires.length > 1}
                                    <span class="badge badge--info">Multi-parent</span>
                                {/if}
                            </div>
                            <div class="card__body">
                                <div class="card__title">{node.title}</div>
                                <div class="muted small">{node.canonicalKey}</div>
                            </div>
                        </button>
                    {/each}
                {/if}
            </div>
        </div>

        <div class="shelf">
            <div class="shelf-title">Current depth</div>
            <div class="cards cards--scroll" bind:this={currentShelfContainer}>
                {#each currentShelf() as node (node.canonicalKey)}
                    <button
                        type="button"
                        class="card {node.canonicalKey === focusedKey ? 'card--focused' : ''}"
                        data-key={node.canonicalKey}
                        on:click={() => focusNode(node.canonicalKey)}
                    >
                        <div class="card__header">
                            <span class="badge">{node.group}</span>
                            {#if node.canonicalKey === rootKey}
                                <span class="badge badge--accent">Root</span>
                            {/if}
                            {#if graph.diagnostics.unreachableNodes.includes(node.canonicalKey)}
                                <span class="badge badge--warn">Unreachable</span>
                            {/if}
                            {#if node.requires.length > 1}
                                <span class="badge badge--info">Multi-parent</span>
                            {/if}
                        </div>
                        <div class="card__body">
                            <div class="card__title">{node.title}</div>
                            <div class="muted small">{node.canonicalKey}</div>
                        </div>
                        {#if node.canonicalKey === focusedKey}
                            <div class="focus-glow" aria-hidden="true" />
                        {/if}
                    </button>
                {/each}
            </div>
        </div>

        <div class="shelf">
            <div class="shelf-title">Children</div>
            <div class="cards" data-shelf="children">
                {#if children().length === 0}
                    <p class="muted">None</p>
                {:else}
                    {#each children() as node (node.canonicalKey)}
                        <button
                            type="button"
                            class="card"
                            data-key={node.canonicalKey}
                            on:click={() => focusNode(node.canonicalKey)}
                        >
                            <div class="card__header">
                                <span class="badge">{node.group}</span>
                                {#if node.canonicalKey === rootKey}
                                    <span class="badge badge--accent">Root</span>
                                {/if}
                                {#if graph.diagnostics.unreachableNodes.includes(node.canonicalKey)}
                                    <span class="badge badge--warn">Unreachable</span>
                                {/if}
                                {#if node.requires.length > 1}
                                    <span class="badge badge--info">Multi-parent</span>
                                {/if}
                            </div>
                            <div class="card__body">
                                <div class="card__title">{node.title}</div>
                                <div class="muted small">{node.canonicalKey}</div>
                            </div>
                        </button>
                    {/each}
                {/if}
            </div>
        </div>
    </div>

    <div class="control-bar">
        <button type="button" on:click={() => moveWithinShelf(-1)} aria-label="Previous in shelf">
            ◀
        </button>
        <button type="button" on:click={() => moveWithinShelf(1)} aria-label="Next in shelf">
            ▶
        </button>
        <button type="button" on:click={() => focusParent(false)} aria-label="Go to parent">
            ▲
        </button>
        <button type="button" on:click={() => focusChild(false)} aria-label="Go to child">
            ▼
        </button>
        <button type="button" on:click={() => focusNode(rootKey)} aria-label="Focus root">
            Root
        </button>
        <button type="button" on:click={() => (showSearch = true)} aria-label="Search quests">
            🔍
        </button>
    </div>

    {#if showSearch}
        <div class="overlay">
            <div class="search-panel">
                <div class="search-header">
                    <h3>Jump to quest</h3>
                    <button class="text-button" type="button" on:click={clearSearch}>Close</button>
                </div>
                <input
                    bind:this={searchInput}
                    type="text"
                    placeholder="Search by name or key"
                    bind:value={searchQuery}
                    on:keydown={(event) => {
                        if (event.key === 'Enter') {
                            const first = searchResults()[0];
                            if (first) {
                                focusNode(first.canonicalKey);
                                clearSearch();
                            }
                        }
                    }}
                />
                <div class="search-results">
                    {#each searchResults() as node (node.canonicalKey)}
                        <button
                            type="button"
                            class="search-result"
                            on:click={() => {
                                focusNode(node.canonicalKey);
                                clearSearch();
                            }}
                        >
                            <div class="search-title">{node.title}</div>
                            <div class="muted small">{node.canonicalKey}</div>
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</section>

<style>
    .quest-graph {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 16px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    .quest-graph__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        flex-wrap: wrap;
    }

    .muted {
        color: var(--color-text);
        opacity: 0.75;
        margin: 0;
    }

    .small {
        font-size: 0.9rem;
    }

    .header-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
    }

    .pill,
    .text-button {
        border: 1px solid var(--color-border);
        background: var(--color-pill);
        color: var(--color-pill-text);
        padding: 8px 12px;
        border-radius: 999px;
        cursor: pointer;
    }

    .text-button {
        background: transparent;
        color: var(--color-heading);
    }

    .shelves {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .shelf-title {
        font-weight: 700;
        margin-bottom: 8px;
    }

    .cards {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(220px, 280px);
        gap: 12px;
        overflow-x: auto;
        padding-bottom: 6px;
        scroll-snap-type: x mandatory;
    }

    .cards::-webkit-scrollbar {
        height: 8px;
    }

    .cards::-webkit-scrollbar-thumb {
        background: var(--color-pill);
        border-radius: 999px;
    }

    .cards--scroll {
        scroll-behavior: smooth;
    }

    .card {
        position: relative;
        background: var(--color-pill-active);
        color: var(--color-pill-active-text);
        border: 2px solid transparent;
        border-radius: 12px;
        padding: 12px;
        text-align: left;
        cursor: pointer;
        scroll-snap-align: start;
        min-height: 120px;
        transition: transform 0.1s ease, box-shadow 0.1s ease, border-color 0.1s ease;
    }

    .card:hover,
    .card:focus-visible {
        transform: translateY(-2px);
        border-color: var(--color-border);
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);
        outline: none;
    }

    .card--focused {
        border-color: var(--color-heading);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.15), 0 12px 24px rgba(0, 0, 0, 0.25);
    }

    .card__header {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        align-items: center;
        margin-bottom: 8px;
    }

    .badge {
        background: var(--color-pill);
        color: var(--color-pill-text);
        border-radius: 12px;
        padding: 2px 8px;
        font-size: 0.85rem;
        border: 1px solid var(--color-border);
    }

    .badge--accent {
        background: var(--color-heading);
        color: var(--color-pill-active-text);
    }

    .badge--warn {
        background: #b66b00;
        color: #fff;
    }

    .badge--info {
        background: #005c99;
        color: #fff;
    }

    .card__title {
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 6px;
    }

    .focus-glow {
        position: absolute;
        inset: -4px;
        border-radius: 14px;
        box-shadow: 0 0 12px rgba(255, 255, 255, 0.35);
        pointer-events: none;
    }

    .control-bar {
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
    }

    .control-bar button {
        background: var(--color-pill);
        color: var(--color-pill-text);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 8px 10px;
        min-width: 48px;
        cursor: pointer;
    }

    .control-bar button:hover,
    .control-bar button:focus-visible {
        outline: none;
        background: var(--color-pill-active);
        color: var(--color-pill-active-text);
    }

    .diagnostics {
        background: rgba(0, 0, 0, 0.2);
        border: 1px dashed var(--color-border);
        border-radius: 12px;
        padding: 12px;
        display: grid;
        gap: 12px;
    }

    .diag-row {
        display: grid;
        gap: 6px;
    }

    .diag-row ul {
        margin: 0;
        padding-left: 18px;
        display: grid;
        gap: 4px;
    }

    .count-badge {
        margin-left: 8px;
        background: var(--color-pill);
        color: var(--color-pill-text);
        padding: 2px 8px;
        border-radius: 10px;
        border: 1px solid var(--color-border);
        font-size: 0.9rem;
    }

    .link-button {
        background: none;
        border: none;
        color: var(--color-heading);
        text-align: left;
        padding: 0;
        cursor: pointer;
        text-decoration: underline;
    }

    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20;
    }

    .search-panel {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 14px;
        padding: 16px;
        width: min(640px, 90vw);
        max-height: 80vh;
        display: grid;
        gap: 12px;
    }

    .search-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    input {
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid var(--color-border);
        background: var(--color-bg);
        color: var(--color-text);
    }

    .search-results {
        display: grid;
        gap: 8px;
        overflow-y: auto;
        max-height: 50vh;
    }

    .search-result {
        text-align: left;
        background: var(--color-pill);
        color: var(--color-pill-text);
        border: 1px solid var(--color-border);
        border-radius: 10px;
        padding: 10px;
        cursor: pointer;
    }

    .search-result:hover,
    .search-result:focus-visible {
        outline: none;
        background: var(--color-pill-active);
        color: var(--color-pill-active-text);
    }

    .search-title {
        font-weight: 700;
        margin-bottom: 4px;
    }

    @media (max-width: 640px) {
        .cards {
            grid-auto-columns: minmax(180px, 220px);
        }

        .quest-graph__header {
            flex-direction: column;
            align-items: flex-start;
        }

        .header-actions {
            width: 100%;
        }
    }
</style>
