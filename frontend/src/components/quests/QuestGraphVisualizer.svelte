<script lang="ts">
    import { onMount, tick } from 'svelte';
    import type { QuestGraph, QuestNode } from '../../lib/quests/questGraph';

    export let graph: QuestGraph;

    const comparatorKeys: Array<keyof QuestNode> = ['group', 'title', 'canonicalKey'];

    const compareNodes = (a?: QuestNode, b?: QuestNode) => {
        if (!a || !b) return a ? -1 : b ? 1 : 0;

        for (const key of comparatorKeys) {
            if (a[key] < b[key]) return -1;
            if (a[key] > b[key]) return 1;
        }

        return 0;
    };

    const sortedNodes = [...(graph.nodes ?? [])].sort(compareNodes);
    const rootCandidate = 'welcome/howtodoquests.json';
    const rootKey =
        (graph.byKey?.[rootCandidate] && rootCandidate) ||
        graph.reachableFromRoot?.[0] ||
        sortedNodes[0]?.canonicalKey ||
        '';

    let focusedKey = rootKey;
    let isSearchOpen = false;
    let searchQuery = '';
    let isDiagnosticsOpen = false;
    let parentCycleIndex = 0;
    let childCycleIndex = 0;
    let parentCycleOrigin = focusedKey;
    let childCycleOrigin = focusedKey;
    let containerEl: HTMLDivElement | null = null;
    let searchInputEl: HTMLInputElement | null = null;

    const getNode = (key?: string) => (key ? graph.byKey?.[key] : undefined);
    const getDepth = (key?: string) => (key ? (graph.depthByKey?.[key] ?? 0) : 0);

    const sortNodes = (nodes: (QuestNode | undefined)[]) =>
        nodes.filter(Boolean).sort(compareNodes) as QuestNode[];

    const getParents = (key?: string) => sortNodes((getNode(key)?.requires ?? []).map(getNode));
    const getChildren = (key?: string) =>
        sortNodes((graph.requiredBy?.[key ?? ''] ?? []).map(getNode));

    const scrollFocusedIntoView = () => {
        if (!containerEl || !focusedKey) return;
        const target = containerEl.querySelector(
            `[data-quest-key="${focusedKey.replace(/"/g, '\\"')}"]`
        );
        if (target instanceof HTMLElement) {
            target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    };

    const setFocus = async (
        key?: string,
        options: { preserveParentCycle?: boolean; preserveChildCycle?: boolean } = {}
    ) => {
        if (!key || !getNode(key)) return;
        if (!options.preserveParentCycle) {
            parentCycleOrigin = key;
            parentCycleIndex = 0;
        }
        if (!options.preserveChildCycle) {
            childCycleOrigin = key;
            childCycleIndex = 0;
        }
        focusedKey = key;
        await tick();
        scrollFocusedIntoView();
    };

    const focusRoot = () => setFocus(rootKey);

    const focusParent = (cycle = false) => {
        parentCycleOrigin = parentCycleOrigin ?? focusedKey;
        const parents = getParents(cycle ? parentCycleOrigin : focusedKey);
        if (parents.length === 0) return;

        if (cycle) {
            const next = parents[parentCycleIndex % parents.length];
            parentCycleIndex = (parentCycleIndex + 1) % parents.length;
            setFocus(next.canonicalKey, { preserveParentCycle: true });
        } else {
            parentCycleOrigin = focusedKey;
            parentCycleIndex = parents.length > 1 ? 1 : 0;
            setFocus(parents[0].canonicalKey, { preserveParentCycle: true });
        }
    };

    const focusChild = (cycle = false) => {
        childCycleOrigin = childCycleOrigin ?? focusedKey;
        const children = getChildren(cycle ? childCycleOrigin : focusedKey);
        if (children.length === 0) return;

        if (cycle) {
            const next = children[childCycleIndex % children.length];
            childCycleIndex = (childCycleIndex + 1) % children.length;
            setFocus(next.canonicalKey, { preserveChildCycle: true });
        } else {
            childCycleOrigin = focusedKey;
            childCycleIndex = children.length > 1 ? 1 : 0;
            setFocus(children[0].canonicalKey, { preserveChildCycle: true });
        }
    };

    const focusSibling = (direction: -1 | 1) => {
        const currentDepth = getDepth(focusedKey);
        const nodesAtDepth = sortedNodes.filter(
            (node) => getDepth(node.canonicalKey) === currentDepth
        );
        const currentIndex = nodesAtDepth.findIndex((node) => node.canonicalKey === focusedKey);
        if (currentIndex === -1) return;

        const nextIndex = currentIndex + direction;
        if (nextIndex < 0 || nextIndex >= nodesAtDepth.length) return;
        setFocus(nodesAtDepth[nextIndex].canonicalKey);
    };

    const openSearch = () => {
        isSearchOpen = true;
        searchQuery = '';
        tick().then(() => {
            searchInputEl?.focus();
            searchInputEl?.select();
        });
    };

    const closeSearch = () => {
        isSearchOpen = false;
        searchQuery = '';
    };

    const handleKeydown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        const isInputElement =
            target?.tagName === 'INPUT' ||
            target?.tagName === 'TEXTAREA' ||
            target?.isContentEditable;

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            openSearch();
            return;
        }

        if (isSearchOpen) {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeSearch();
            }
            return;
        }

        if (isInputElement) return;

        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                focusSibling(-1);
                break;
            case 'ArrowRight':
                event.preventDefault();
                focusSibling(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                focusParent(event.shiftKey);
                break;
            case 'ArrowDown':
                event.preventDefault();
                focusChild(event.shiftKey);
                break;
            case 'Escape':
                searchQuery = '';
                isSearchOpen = false;
                break;
            default:
                break;
        }
    };

    onMount(() => {
        const listener = (event: KeyboardEvent) => handleKeydown(event);
        window.addEventListener('keydown', listener);
        containerEl?.focus();
        scrollFocusedIntoView();

        return () => {
            window.removeEventListener('keydown', listener);
        };
    });

    $: currentDepth = getDepth(focusedKey);

    $: searchResults = (() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return sortedNodes;
        return sortedNodes.filter(
            (node) =>
                node.title.toLowerCase().includes(query) ||
                node.canonicalKey.toLowerCase().includes(query) ||
                node.basename.toLowerCase().includes(query)
        );
    })();
</script>

<div class="visualizer" role="region" aria-label="Quest navigator" bind:this={containerEl}>
    <header class="visualizer__header">
        <div>
            <p class="eyebrow">Quest Navigator</p>
            {#if focusedKey}
                <div class="focused-meta">
                    <span class="label">Focused:</span>
                    <strong>{getNode(focusedKey)?.title ?? focusedKey}</strong>
                    <span class="meta-pill">Depth {currentDepth}</span>
                </div>
            {/if}
        </div>
        <div class="controls">
            <button class="control-button" type="button" on:click={() => focusSibling(-1)}>
                ◀
                <span class="sr-only">Previous at depth</span>
            </button>
            <button class="control-button" type="button" on:click={() => focusSibling(1)}>
                ▶
                <span class="sr-only">Next at depth</span>
            </button>
            <button class="control-button" type="button" on:click={() => focusParent(false)}>
                ▲
                <span class="sr-only">Focus parent</span>
            </button>
            <button class="control-button" type="button" on:click={() => focusChild(false)}>
                ▼
                <span class="sr-only">Focus child</span>
            </button>
            <button class="control-button" type="button" on:click={focusRoot}>
                ⌂
                <span class="sr-only">Focus root quest</span>
            </button>
            <button class="control-button" type="button" on:click={openSearch}>
                🔍
                <span class="sr-only">Open quest search</span>
            </button>
        </div>
    </header>

    <div class="shelves">
        <section class="shelf">
            <div class="shelf__title">
                <h3>Parents</h3>
                <span class="badge">{getParents(focusedKey).length}</span>
            </div>
            <div class="shelf__track" aria-label="Parent quests" data-shelf="parents">
                {#if getParents(focusedKey).length === 0}
                    <p class="empty">No parents</p>
                {/if}
                {#each getParents(focusedKey) as node (node.canonicalKey)}
                    <button
                        class="quest-card"
                        class:quest-card--focused={node.canonicalKey === focusedKey}
                        data-quest-key={node.canonicalKey}
                        type="button"
                        on:click={() => setFocus(node.canonicalKey)}
                    >
                        <p class="quest-card__group">{node.group}</p>
                        <p class="quest-card__title">{node.title}</p>
                        <p class="quest-card__key">{node.basename}</p>
                    </button>
                {/each}
            </div>
        </section>

        <section class="shelf current">
            <div class="shelf__title">
                <h3>Current depth</h3>
                <span class="badge">
                    {sortedNodes.filter((node) => getDepth(node.canonicalKey) === currentDepth)
                        .length}
                </span>
            </div>
            <div class="shelf__track" aria-label="Quests at current depth" data-shelf="current">
                {#if !focusedKey}
                    <p class="empty">No quest selected</p>
                {/if}
                {#each sortedNodes.filter((node) => getDepth(node.canonicalKey) === currentDepth) as node (node.canonicalKey)}
                    <button
                        class="quest-card"
                        class:quest-card--focused={node.canonicalKey === focusedKey}
                        data-quest-key={node.canonicalKey}
                        type="button"
                        on:click={() => setFocus(node.canonicalKey)}
                    >
                        <p class="quest-card__group">{node.group}</p>
                        <p class="quest-card__title">{node.title}</p>
                        <p class="quest-card__key">{node.basename}</p>
                    </button>
                {/each}
            </div>
        </section>

        <section class="shelf">
            <div class="shelf__title">
                <h3>Children</h3>
                <span class="badge">{getChildren(focusedKey).length}</span>
            </div>
            <div class="shelf__track" aria-label="Child quests" data-shelf="children">
                {#if getChildren(focusedKey).length === 0}
                    <p class="empty">No children</p>
                {/if}
                {#each getChildren(focusedKey) as node (node.canonicalKey)}
                    <button
                        class="quest-card"
                        class:quest-card--focused={node.canonicalKey === focusedKey}
                        data-quest-key={node.canonicalKey}
                        type="button"
                        on:click={() => setFocus(node.canonicalKey)}
                    >
                        <p class="quest-card__group">{node.group}</p>
                        <p class="quest-card__title">{node.title}</p>
                        <p class="quest-card__key">{node.basename}</p>
                    </button>
                {/each}
            </div>
        </section>
    </div>

    <div class="diagnostics">
        <button
            class="diagnostics__toggle"
            type="button"
            aria-expanded={isDiagnosticsOpen}
            on:click={() => (isDiagnosticsOpen = !isDiagnosticsOpen)}
        >
            Diagnostics
            <span class="badge"
                >{graph.diagnostics.missingRefs.length +
                    graph.diagnostics.ambiguousRefs.length +
                    graph.diagnostics.unreachableNodes.length +
                    graph.diagnostics.cycles.length}</span
            >
            <span aria-hidden="true">{isDiagnosticsOpen ? '▴' : '▾'}</span>
        </button>

        {#if isDiagnosticsOpen}
            <div class="diagnostics__content">
                <div class="diagnostic-group">
                    <div class="diagnostic-heading">
                        <h4>Missing references</h4>
                        <span class="badge">{graph.diagnostics.missingRefs.length}</span>
                    </div>
                    {#if graph.diagnostics.missingRefs.length === 0}
                        <p class="empty">None</p>
                    {:else}
                        <ul>
                            {#each graph.diagnostics.missingRefs as issue, index}
                                <li>
                                    <button type="button" on:click={() => setFocus(issue.from)}>
                                        {issue.from} → {issue.ref}
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>

                <div class="diagnostic-group">
                    <div class="diagnostic-heading">
                        <h4>Ambiguous references</h4>
                        <span class="badge">{graph.diagnostics.ambiguousRefs.length}</span>
                    </div>
                    {#if graph.diagnostics.ambiguousRefs.length === 0}
                        <p class="empty">None</p>
                    {:else}
                        <ul>
                            {#each graph.diagnostics.ambiguousRefs as issue}
                                <li>
                                    <button type="button" on:click={() => setFocus(issue.from)}>
                                        {issue.from} → {issue.ref} ({issue.candidates.length} options)
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>

                <div class="diagnostic-group">
                    <div class="diagnostic-heading">
                        <h4>Unreachable</h4>
                        <span class="badge">{graph.diagnostics.unreachableNodes.length}</span>
                    </div>
                    {#if graph.diagnostics.unreachableNodes.length === 0}
                        <p class="empty">None</p>
                    {:else}
                        <ul>
                            {#each graph.diagnostics.unreachableNodes as key}
                                <li>
                                    <button type="button" on:click={() => setFocus(key)}>
                                        {key}
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>

                <div class="diagnostic-group">
                    <div class="diagnostic-heading">
                        <h4>Cycles</h4>
                        <span class="badge">{graph.diagnostics.cycles.length}</span>
                    </div>
                    {#if graph.diagnostics.cycles.length === 0}
                        <p class="empty">None</p>
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

    {#if isSearchOpen}
        <div class="search-overlay" role="dialog" aria-label="Jump to quest">
            <div class="search">
                <div class="search__header">
                    <p>Jump to quest</p>
                    <button class="control-button" type="button" on:click={closeSearch}>
                        ✕<span class="sr-only">Close search</span>
                    </button>
                </div>
                <input
                    bind:this={searchInputEl}
                    type="text"
                    placeholder="Search quests by name or path"
                    value={searchQuery}
                    on:input={(event) => (searchQuery = event.currentTarget.value)}
                    on:keydown={(event) => event.stopPropagation()}
                />
                <div class="search__results">
                    {#if searchResults.length === 0}
                        <p class="empty">No matches</p>
                    {:else}
                        <ul>
                            {#each searchResults as node (node.canonicalKey)}
                                <li>
                                    <button
                                        type="button"
                                        on:click={() => {
                                            setFocus(node.canonicalKey);
                                            closeSearch();
                                        }}
                                    >
                                        <span class="quest-title">{node.title}</span>
                                        <span class="quest-key">{node.canonicalKey}</span>
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
    .visualizer {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
    }

    .visualizer__header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
    }

    .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
        margin: 0;
        color: var(--color-heading);
    }

    .focused-meta {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
    }

    .label {
        opacity: 0.9;
    }

    .meta-pill {
        background: var(--color-pill);
        color: var(--color-pill-text);
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 0.85rem;
    }

    .controls {
        display: inline-flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .control-button {
        background: var(--color-pill);
        color: var(--color-pill-text);
        border: 1px solid var(--color-border);
        border-radius: 10px;
        padding: 6px 10px;
        font-size: 1rem;
        cursor: pointer;
        transition:
            transform 0.1s ease,
            box-shadow 0.1s ease;
    }

    .control-button:hover,
    .control-button:focus-visible {
        transform: translateY(-1px);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }

    .shelves {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 12px;
    }

    .shelf {
        background: color-mix(in srgb, var(--color-surface) 90%, var(--color-bg));
        border: 1px solid var(--color-border);
        border-radius: 12px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .current {
        border-width: 2px;
    }

    .shelf__title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin: 0 4px;
    }

    .badge {
        background: var(--color-pill);
        color: var(--color-pill-text);
        border-radius: 999px;
        padding: 2px 8px;
        font-size: 0.85rem;
        border: 1px solid var(--color-border);
    }

    .shelf__track {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding: 6px 2px;
        scroll-snap-type: x mandatory;
        scroll-behavior: smooth;
    }

    .quest-card {
        min-width: 200px;
        border-radius: 12px;
        background: linear-gradient(
            145deg,
            color-mix(in srgb, var(--color-pill) 70%, var(--color-bg)),
            color-mix(in srgb, var(--color-surface) 90%, transparent)
        );
        color: var(--color-text);
        border: 2px solid var(--color-border);
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        scroll-snap-align: center;
        cursor: pointer;
        text-align: left;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
        transition:
            box-shadow 0.15s ease,
            transform 0.15s ease,
            border-color 0.15s ease;
    }

    .quest-card:hover,
    .quest-card:focus-visible {
        transform: translateY(-2px);
        border-color: var(--color-pill-active);
    }

    .quest-card--focused {
        border-color: var(--color-pill-active);
        box-shadow:
            0 0 0 3px color-mix(in srgb, var(--color-pill-active) 60%, transparent),
            0 8px 18px rgba(0, 0, 0, 0.3);
    }

    .quest-card__group {
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-size: 0.85rem;
        margin: 0;
        color: var(--color-heading);
    }

    .quest-card__title {
        font-size: 1.05rem;
        margin: 0;
        font-weight: 700;
    }

    .quest-card__key {
        margin: 0;
        opacity: 0.9;
        font-family:
            ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas,
            'Liberation Mono', 'Courier New', monospace;
        font-size: 0.9rem;
    }

    .diagnostics {
        border-top: 1px solid var(--color-border);
        padding-top: 10px;
    }

    .diagnostics__toggle {
        background: transparent;
        color: var(--color-text);
        border: 1px solid var(--color-border);
        border-radius: 10px;
        padding: 8px 12px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    .diagnostics__content {
        margin-top: 10px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
    }

    .diagnostic-group {
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 8px;
        background: color-mix(in srgb, var(--color-surface) 80%, var(--color-bg));
    }

    .diagnostic-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
    }

    ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    li button {
        background: transparent;
        border: 1px dashed var(--color-border);
        color: var(--color-text);
        border-radius: 6px;
        padding: 6px;
        text-align: left;
        cursor: pointer;
    }

    li button:hover,
    li button:focus-visible {
        border-style: solid;
    }

    .empty {
        margin: 0;
        opacity: 0.8;
        font-style: italic;
    }

    .search-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        padding: 20px;
    }

    .search {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        padding: 14px;
        width: min(680px, 100%);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .search__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    input[type='text'] {
        padding: 10px;
        border-radius: 8px;
        border: 1px solid var(--color-border);
        background: color-mix(in srgb, var(--color-bg) 70%, var(--color-surface));
        color: var(--color-text);
    }

    .search__results ul {
        max-height: 340px;
        overflow-y: auto;
    }

    .search__results button {
        width: 100%;
        background: transparent;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        cursor: pointer;
    }

    .quest-title {
        font-weight: 700;
    }

    .quest-key {
        opacity: 0.9;
        font-family:
            ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
            monospace;
        font-size: 0.9rem;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    @media (max-width: 640px) {
        .controls {
            width: 100%;
            justify-content: flex-end;
        }

        .visualizer {
            padding: 12px;
        }

        .quest-card {
            min-width: 180px;
        }
    }
</style>
