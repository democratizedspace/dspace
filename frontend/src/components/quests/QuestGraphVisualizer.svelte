<script>
    import { onMount, tick } from 'svelte';
    import { isBrowser } from '../../utils/ssr.js';
    import QuestGraphCard from './QuestGraphCard.svelte';

    export let graph;

    const ROOT_KEY = 'welcome/howtodoquests.json';
    const byKey = graph?.byKey ?? {};
    const reachableKeys = new Set(graph?.reachableFromRoot ?? []);
    const unreachableKeys = new Set(graph?.diagnostics?.unreachableNodes ?? []);
    const cycleKeys = new Set((graph?.diagnostics?.cycles ?? []).flat());
    const multiParentKeys = new Set(
        (graph?.nodes ?? [])
            .filter((node) => (node.requires?.length ?? 0) > 1)
            .map((node) => node.canonicalKey)
    );

    const compareNodes = (a, b) => {
        if (!a || !b) return a ? -1 : b ? 1 : 0;
        const order = ['group', 'title', 'canonicalKey'];
        for (const key of order) {
            if (a[key] < b[key]) return -1;
            if (a[key] > b[key]) return 1;
        }
        return 0;
    };

    const sortKeys = (keys) => [...keys].sort((a, b) => compareNodes(byKey[a], byKey[b]));

    const getSortedNodes = () => [...(graph?.nodes ?? [])].sort(compareNodes);

    const resolveRoot = () => {
        if (byKey[ROOT_KEY]) return ROOT_KEY;
        const sortedNodes = getSortedNodes();
        const howToMatches = sortedNodes.filter(
            (node) => node.canonicalKey.split('/').pop() === 'howtodoquests.json'
        );
        if (howToMatches.length === 1) {
            return howToMatches[0].canonicalKey;
        }
        return sortedNodes[0]?.canonicalKey ?? '';
    };

    const rootKey = resolveRoot();

    let activeTab = 'navigator';
    let focusedKey = rootKey;
    let searchOpen = false;
    let searchQuery = '';
    let parentCycleIndex = 0;
    let childCycleIndex = 0;
    let visualizerEl = null;
    let searchInput = null;
    let mapContainer = null;
    let mapError = '';
    let mapLoading = false;
    let showUnreachable = false;
    let highlightMultiParent = true;
    let cy = null;
    let layoutQueued = false;

    const mapLayoutOptions = {
        name: 'dagre',
        rankDir: 'TB',
        padding: 24,
        nodeSep: 32,
        rankSep: 64,
        nodeDimensionsIncludeLabels: true,
    };

    const cards = new Map();
    const cardRef = (node, key) => {
        let currentKey = key;
        if (currentKey) {
            cards.set(currentKey, node);
        }
        return {
            destroy() {
                if (currentKey) {
                    cards.delete(currentKey);
                }
            },
            update(nextKey) {
                if (currentKey && nextKey !== currentKey) {
                    cards.delete(currentKey);
                }
                currentKey = nextKey;
                if (currentKey) {
                    cards.set(currentKey, node);
                }
            },
        };
    };
    const resetCycles = () => {
        parentCycleIndex = 0;
        childCycleIndex = 0;
    };
    const closeSearch = () => {
        searchOpen = false;
        searchQuery = '';
    };

    $: focusedNode = byKey[focusedKey];
    $: parentKeys = focusedNode ? sortKeys(focusedNode.requires ?? []) : [];
    $: childKeys = focusedKey ? sortKeys(graph?.requiredBy?.[focusedKey] ?? []) : [];
    $: depth = focusedKey ? (graph?.depthByKey?.[focusedKey] ?? 0) : 0;
    $: depthKeys = sortKeys(
        (graph?.nodes ?? [])
            .filter((node) => graph?.depthByKey?.[node.canonicalKey] === depth)
            .map((node) => node.canonicalKey)
    );
    $: searchResults = (() => {
        const query = searchQuery.trim().toLowerCase();
        const nodes = getSortedNodes();
        const filteredNodes = query
            ? nodes.filter(
                  (node) =>
                      node.title.toLowerCase().includes(query) ||
                      node.canonicalKey.toLowerCase().includes(query)
              )
            : nodes;
        return filteredNodes.map((node) => node.canonicalKey);
    })();
    $: if (searchOpen) {
        tick().then(() => {
            searchInput?.focus();
            searchInput?.select();
        });
    }

    const setFocus = async (key, options = {}) => {
        if (!key || !byKey[key]) return;
        focusedKey = key;
        if (options.resetCycles !== false) {
            resetCycles();
        }
        await tick();
        const card = cards.get(focusedKey);
        if (card?.scrollIntoView) {
            card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    };

    const moveWithinDepth = (delta) => {
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

    const handleKeydown = (event) => {
        if (event.defaultPrevented) return;
        const target = event.target;
        const isEditableTarget =
            target?.closest('input, textarea') !== null || target?.isContentEditable;
        const isSearchShortcut =
            (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
        const isOverlayEscape = searchOpen && event.key === 'Escape';
        if (isEditableTarget && !isSearchShortcut && !isOverlayEscape) {
            return;
        }
        const isInsideVisualizer = target ? visualizerEl?.contains(target) : false;
        if (!isInsideVisualizer && !searchOpen && !isSearchShortcut) return;

        if (isSearchShortcut) {
            event.preventDefault();
            searchOpen = true;
            return;
        }

        if (event.key === 'Escape') {
            if (searchOpen) {
                closeSearch();
                event.preventDefault();
            }
            return;
        }

        if (searchOpen || activeTab !== 'navigator') return;

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
    const handleOverlayKeydown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            closeSearch();
        }
    };

    const setTab = async (tab) => {
        activeTab = tab;
        if (tab === 'map') {
            await tick();
            await ensureCytoscape();
            cy?.resize();
            highlightCyFocus();
        }
    };

    const getNodeClasses = (node) => {
        const classes = [];
        if (!reachableKeys.has(node.canonicalKey)) classes.push('unreachable');
        if (highlightMultiParent && multiParentKeys.has(node.canonicalKey)) {
            classes.push('multi-parent');
        }
        if (cycleKeys.has(node.canonicalKey)) classes.push('cycle');
        if (node.canonicalKey === rootKey) classes.push('root');
        return classes.join(' ');
    };

    const buildElements = () => {
        const visibleNodes = (graph?.nodes ?? []).filter(
            (node) =>
                showUnreachable ||
                reachableKeys.has(node.canonicalKey) ||
                node.canonicalKey === focusedKey
        );
        const allowedKeys = new Set(visibleNodes.map((node) => node.canonicalKey));

        const nodeElements = visibleNodes.map((node) => ({
            data: {
                id: node.canonicalKey,
                label: node.title,
                canonicalKey: node.canonicalKey,
            },
            classes: getNodeClasses(node),
        }));

        const edgeElements = (graph?.edges ?? [])
            .filter((edge) => allowedKeys.has(edge.from) && allowedKeys.has(edge.to))
            .map((edge) => ({
                data: {
                    id: `${edge.from}->${edge.to}`,
                    source: edge.from,
                    target: edge.to,
                },
            }));

        return [...nodeElements, ...edgeElements];
    };

    const getCyStyles = () => [
        {
            selector: 'node',
            style: {
                shape: 'round-rectangle',
                'background-color': 'var(--color-pill)',
                'border-color': 'var(--color-border)',
                'border-width': 2,
                color: 'var(--color-pill-text)',
                label: 'data(label)',
                'font-size': '12px',
                'font-weight': '700',
                'text-wrap': 'wrap',
                'text-max-width': '180px',
                'text-valign': 'center',
                'text-halign': 'center',
                padding: '10px',
                'shadow-blur': 6,
                'shadow-color': 'rgba(0, 0, 0, 0.35)',
            },
        },
        {
            selector: 'node.focused',
            style: {
                'border-color': 'var(--color-pill-active)',
                'border-width': 3,
                'shadow-blur': 10,
                'shadow-color': 'rgba(104, 212, 109, 0.6)',
            },
        },
        {
            selector: 'node.parent-of-focus',
            style: {
                'border-color': 'var(--color-pill-active)',
                'background-color': 'var(--color-surface)',
            },
        },
        {
            selector: 'node.child-of-focus',
            style: {
                'border-color': 'var(--color-pill-active)',
                'background-color': 'rgba(104, 212, 109, 0.2)',
            },
        },
        {
            selector: 'node.unreachable',
            style: {
                'background-color': 'rgba(255, 255, 255, 0.05)',
                'border-style': 'dashed',
                'border-color': 'var(--color-border)',
                color: 'var(--color-text)',
            },
        },
        {
            selector: 'node.multi-parent',
            style: {
                'border-style': 'double',
                'border-color': 'var(--color-pill-active)',
            },
        },
        {
            selector: 'node.cycle',
            style: {
                'border-color': '#f5c542',
                'background-color': 'rgba(245, 197, 66, 0.12)',
            },
        },
        {
            selector: 'node.root',
            style: {
                'border-color': 'var(--color-pill-active)',
                'border-width': 3,
            },
        },
        {
            selector: 'edge',
            style: {
                'curve-style': 'bezier',
                width: 2,
                'line-color': 'var(--color-border)',
                'target-arrow-color': 'var(--color-border)',
                'target-arrow-shape': 'triangle',
                'arrow-scale': 1,
            },
        },
        {
            selector: 'edge.related',
            style: {
                'line-color': 'var(--color-pill-active)',
                'target-arrow-color': 'var(--color-pill-active)',
                width: 3,
            },
        },
    ];

    const scheduleLayout = () => {
        if (!cy || !isBrowser || layoutQueued) return;
        layoutQueued = true;
        requestAnimationFrame(() => {
            layoutQueued = false;
            cy?.layout(mapLayoutOptions).run();
        });
    };

    const syncCyElements = (options = {}) => {
        if (!cy) return;
        cy.elements().remove();
        cy.add(buildElements());
        if (options.shouldLayout !== false) {
            scheduleLayout();
        }
        highlightCyFocus();
    };

    const highlightCyFocus = () => {
        if (!cy) return;
        cy.nodes().removeClass('focused parent-of-focus child-of-focus');
        cy.edges().removeClass('related');

        const target = cy.getElementById(focusedKey);
        if (target && target.length) {
            target.addClass('focused');
            target.incomers('node').addClass('parent-of-focus');
            target.outgoers('node').addClass('child-of-focus');
            target.connectedEdges().addClass('related');
        }
    };

    const ensureCytoscape = async () => {
        if (!isBrowser || !mapContainer) return null;
        if (cy) {
            syncCyElements({ shouldLayout: false });
            return cy;
        }
        mapLoading = true;
        mapError = '';
        try {
            const [{ default: cytoscape }, { default: cytoscapeDagre }] = await Promise.all([
                import('cytoscape'),
                import('cytoscape-dagre'),
            ]);
            cytoscape.use(cytoscapeDagre);
            cy = cytoscape({
                container: mapContainer,
                elements: buildElements(),
                style: getCyStyles(),
                layout: mapLayoutOptions,
                wheelSensitivity: 0.25,
                pixelRatio: 1,
                motionBlur: false,
                boxSelectionEnabled: false,
            });
            cy.on('tap', 'node', (event) => {
                const key = event.target.id();
                setFocus(key);
                highlightCyFocus();
            });
        } catch (error) {
            mapError = error instanceof Error ? error.message : String(error);
        } finally {
            mapLoading = false;
        }

        if (cy) {
            scheduleLayout();
        }
        return cy;
    };

    const setShowUnreachable = (value) => {
        showUnreachable = value;
        if (cy) {
            syncCyElements();
        }
    };

    const setHighlightMultiParent = (value) => {
        highlightMultiParent = value;
        if (cy) {
            syncCyElements({ shouldLayout: false });
        }
    };

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
        setFocus(focusedKey);
        return () => {
            window.removeEventListener('keydown', handleKeydown);
            cy?.destroy();
            cy = null;
        };
    });

    $: if (cy) {
        highlightCyFocus();
    }
</script>

<div class="visualizer" bind:this={visualizerEl}>
    <div class="header">
        <div>
            <p class="eyebrow">Quest Graph (QA)</p>
            <h3>{focusedNode ? focusedNode.title : 'Quest graph'}</h3>
            {#if focusedNode}
                <p class="subtle">{focusedNode.canonicalKey}</p>
            {/if}
        </div>
        <div class="controls">
            <button class="pill" type="button" on:click={() => setFocus(rootKey)}> Root </button>
            <button class="pill" type="button" on:click={() => (searchOpen = true)}>
                Search
            </button>
        </div>
    </div>

    <div class="tab-bar" role="tablist" aria-label="Quest graph views">
        <button
            class="tab"
            role="tab"
            aria-selected={activeTab === 'navigator'}
            type="button"
            on:click={() => setTab('navigator')}
        >
            Navigator
        </button>
        <button
            class="tab"
            role="tab"
            aria-selected={activeTab === 'map'}
            type="button"
            on:click={() => setTab('map')}
        >
            Map
        </button>
        <button
            class="tab"
            role="tab"
            aria-selected={activeTab === 'diagnostics'}
            type="button"
            on:click={() => setTab('diagnostics')}
        >
            Diagnostics
        </button>
    </div>

    <div class="tab-panels">
        <section
            class="tab-panel"
            data-active={activeTab === 'navigator'}
            hidden={activeTab !== 'navigator'}
            aria-label="Navigator view"
        >
            <div class="shelves">
                <div class="shelf">
                    <div class="shelf-label">Parents</div>
                    <div class="cards">
                        {#if parentKeys.length === 0}
                            <div class="empty">No parents</div>
                        {:else}
                            {#each parentKeys as key}
                                {#if byKey[key]}
                                    <QuestGraphCard
                                        node={byKey[key]}
                                        keyValue={key}
                                        register={cardRef}
                                        isFocused={key === focusedKey}
                                        isMultiParent={(byKey[key].requires?.length ?? 0) > 1}
                                        on:select={() => setFocus(key)}
                                    />
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
                                    <QuestGraphCard
                                        node={byKey[key]}
                                        keyValue={key}
                                        register={cardRef}
                                        isFocused={key === focusedKey}
                                        isRoot={key === rootKey}
                                        isMultiParent={(byKey[key].requires?.length ?? 0) > 1}
                                        on:select={() => setFocus(key)}
                                    />
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
                                    <QuestGraphCard
                                        node={byKey[key]}
                                        keyValue={key}
                                        register={cardRef}
                                        isFocused={key === focusedKey}
                                        isMultiParent={(byKey[key].requires?.length ?? 0) > 1}
                                        on:select={() => setFocus(key)}
                                    />
                                {/if}
                            {/each}
                        {/if}
                    </div>
                </div>
            </div>

            <div class="control-bar" aria-label="Navigator controls">
                <button
                    type="button"
                    on:click={() => moveWithinDepth(-1)}
                    aria-label="Previous at depth"
                >
                    Prev
                </button>
                <button
                    type="button"
                    on:click={() => moveWithinDepth(1)}
                    aria-label="Next at depth"
                >
                    Next
                </button>
                <button type="button" on:click={() => focusParent(false)} aria-label="First parent">
                    Parent
                </button>
                <button type="button" on:click={() => focusChild(false)} aria-label="First child">
                    Child
                </button>
                <button type="button" on:click={() => setFocus(rootKey)} aria-label="Go to root">
                    Root
                </button>
                <button type="button" on:click={() => (searchOpen = true)} aria-label="Search">
                    Search
                </button>
            </div>
        </section>

        <section
            class="tab-panel map-panel"
            data-active={activeTab === 'map'}
            hidden={activeTab !== 'map'}
            aria-label="Map view"
        >
            <div class="map-controls">
                <div class="toggle-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={showUnreachable}
                            on:change={(event) => setShowUnreachable(event.currentTarget.checked)}
                        />
                        Show unreachable ({unreachableKeys.size})
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={highlightMultiParent}
                            on:change={(event) =>
                                setHighlightMultiParent(event.currentTarget.checked)}
                        />
                        Highlight multi-parent
                    </label>
                </div>
                <p class="subtle">Scroll or pinch to zoom. Drag to pan. Click nodes to focus.</p>
            </div>

            {#if mapError}
                <div class="map-error">
                    <p>Map failed to load.</p>
                    <p class="subtle">{mapError}</p>
                </div>
            {:else}
                <div class="map-frame" aria-busy={mapLoading} data-loading={mapLoading}>
                    {#if mapLoading}
                        <p class="subtle">Loading map assets…</p>
                    {/if}
                    <div class="map-container" bind:this={mapContainer} data-ready={!!cy}></div>
                </div>
                <div class="legend">
                    <div class="legend-row">
                        <span class="legend-swatch reachable"></span>
                        <span class="legend-label">Reachable</span>
                        <span class="legend-swatch unreachable"></span>
                        <span class="legend-label">Unreachable</span>
                        <span class="legend-swatch multi"></span>
                        <span class="legend-label">Multi-parent</span>
                        <span class="legend-swatch cycle"></span>
                        <span class="legend-label">Cycle</span>
                    </div>
                    <p class="subtle">
                        Map shares focus with Navigator. Toggle to include unreachable quests.
                    </p>
                </div>
            {/if}
        </section>

        <section
            class="tab-panel"
            data-active={activeTab === 'diagnostics'}
            hidden={activeTab !== 'diagnostics'}
            aria-label="Diagnostics"
        >
            <div class="diagnostics">
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
                                            {issue.from} → {issue.ref}
                                            <span class="subtle">
                                                ({issue.candidates.length} candidates)
                                            </span>
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
                                        <button type="button" on:click={() => setFocus(key)}>
                                            {key}
                                        </button>
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
            </div>
        </section>
    </div>

    {#if searchOpen}
        <div
            class="overlay"
            role="presentation"
            tabindex="-1"
            on:keydown|stopPropagation={handleOverlayKeydown}
            on:click={closeSearch}
        >
            <div
                class="search"
                role="dialog"
                aria-modal="true"
                aria-label="Quest search dialog"
                tabindex="-1"
                on:click|stopPropagation
                on:keydown|stopPropagation
            >
                <div class="search-header">
                    <input
                        type="text"
                        placeholder="Jump to quest"
                        bind:value={searchQuery}
                        bind:this={searchInput}
                    />
                    <button type="button" on:click={closeSearch}> Close </button>
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
                                        closeSearch();
                                    }}
                                >
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

    .tab-bar {
        display: flex;
        gap: 8px;
        margin: 16px 0 8px;
        flex-wrap: wrap;
    }

    .tab {
        background: rgba(0, 0, 0, 0.1);
        color: var(--color-heading);
        border: 1px solid var(--color-border);
        border-radius: 10px;
        padding: 8px 14px;
        cursor: pointer;
    }

    .tab[aria-selected='true'] {
        background: var(--color-pill);
        color: var(--color-pill-text);
        border-color: var(--color-pill-active);
    }

    .tab-panels {
        display: grid;
    }

    .tab-panel {
        display: none;
    }

    .tab-panel[data-active='true'] {
        display: block;
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

    .map-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 12px;
    }

    .toggle-group {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
    }

    .toggle-group label {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--color-heading);
    }

    .map-frame {
        background: rgba(0, 0, 0, 0.08);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        min-height: 420px;
        position: relative;
        overflow: hidden;
    }

    .map-frame[data-loading='true'] {
        display: grid;
        place-items: center;
    }

    .map-container {
        width: 100%;
        height: 480px;
    }

    .map-error {
        background: rgba(255, 85, 85, 0.1);
        border: 1px solid rgba(255, 85, 85, 0.4);
        border-radius: 10px;
        padding: 12px;
        color: var(--color-heading);
    }

    .legend {
        margin-top: 10px;
        background: rgba(0, 0, 0, 0.06);
        border: 1px solid var(--color-border);
        border-radius: 10px;
        padding: 10px;
        display: grid;
        gap: 6px;
    }

    .legend-row {
        display: grid;
        grid-template-columns: repeat(8, auto);
        align-items: center;
        gap: 8px;
        width: fit-content;
    }

    .legend-swatch {
        width: 14px;
        height: 14px;
        border-radius: 4px;
        display: inline-block;
        border: 1px solid var(--color-border);
    }

    .legend-swatch.reachable {
        background: var(--color-pill);
    }

    .legend-swatch.unreachable {
        background: rgba(255, 255, 255, 0.08);
    }

    .legend-swatch.multi {
        background: var(--color-pill);
        border-style: double;
        border-color: var(--color-pill-active);
    }

    .legend-swatch.cycle {
        background: rgba(245, 197, 66, 0.4);
        border-color: #f5c542;
    }

    .legend-label {
        color: var(--color-heading);
        font-size: 0.9rem;
    }

    .diagnostics {
        margin-top: 12px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        padding: 10px;
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

        .legend-row {
            grid-template-columns: repeat(4, auto);
        }
    }
</style>
