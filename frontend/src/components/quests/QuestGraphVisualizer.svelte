<script>
    import { onMount, tick } from 'svelte';
    import { copyToClipboard } from '../../utils/copyToClipboard.js';
    import { formatDiagnosticsReport, getDiagnosticsView } from '../../lib/quests/questGraphReport';
    import QuestGraphCard from './QuestGraphCard.svelte';

    export let graph;

    const byKey = graph?.byKey ?? {};
    let visualizerEl = null;
    let mapContainer = null;
    let searchInput = null;

    let activeTab = 'navigator';
    let mapStatus = 'idle';
    let mapError = '';
    let showUnreachable = false;
    let prevShowUnreachable = showUnreachable;
    let highlightMultiParent = true;
    let mapInitialized = false;
    let cy = null;
    let hasMounted = false;

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

    const reachableSet = new Set(graph?.reachableFromRoot ?? []);
    const unreachableSet = new Set(graph?.diagnostics?.unreachableNodes ?? []);
    const cycleNodeSet = new Set(graph?.diagnostics?.cycles?.flatMap((cycle) => cycle) ?? []);
    const multiParentKeys = new Set(
        (graph?.nodes ?? [])
            .filter((node) => (node.requires?.length ?? 0) > 1)
            .map((node) => node.canonicalKey)
    );

    let diagnosticsView = getDiagnosticsView(graph, { includeMultiParent: true });
    let rootKey = diagnosticsView.rootKey;
    const resolveRoot = () => rootKey;

    let focusedKey = resolveRoot();
    let searchOpen = false;
    let searchQuery = '';
    let parentCycleIndex = 0;
    let childCycleIndex = 0;
    let copyFeedback = '';
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

    $: diagnosticsView = getDiagnosticsView(graph, { includeMultiParent: true });
    $: rootKey = diagnosticsView.rootKey;
    $: if (rootKey && !byKey[focusedKey]) {
        focusedKey = rootKey;
    }
    $: focusedNode = byKey[focusedKey];
    $: unreachableCount = graph?.diagnostics?.unreachableNodes?.length ?? 0;
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

    const jumpToNode = async (key) => {
        if (!key) return;
        if (activeTab !== 'navigator') {
            activeTab = 'navigator';
            await tick();
        }
        await setFocus(key);
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
        if (!isInsideVisualizer && !searchOpen) return;

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
    const handleOverlayKeydown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            closeSearch();
        }
    };
    const handleCopyReport = async () => {
        copyFeedback = 'Copying…';
        try {
            const reportText = formatDiagnosticsReport(graph, {
                includeMultiParent: true,
                multiParentLimit: 20,
            });
            await copyToClipboard(reportText);
            copyFeedback = 'Report copied';
            setTimeout(() => {
                copyFeedback = '';
            }, 2500);
        } catch (error) {
            console.error('Failed to copy diagnostics report', error);
            copyFeedback = 'Copy failed';
        }
    };

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
        setFocus(focusedKey);
        hasMounted = true;
        return () => {
            window.removeEventListener('keydown', handleKeydown);
            cy?.destroy?.();
        };
    });

    const getCssVar = (name, fallback) => {
        if (typeof window === 'undefined') return fallback;
        const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return value || fallback;
    };

    const mapStyles = () => ({
        background: getCssVar('--color-surface', '#121212'),
        nodeFill: getCssVar('--color-pill', '#1f6feb'),
        nodeText: getCssVar('--color-pill-text', '#ffffff'),
        nodeAccent: getCssVar('--color-pill-active', '#68d46d'),
        nodeAccentText: getCssVar('--color-pill-active-text', '#0b1f0f'),
        nodeBorder: getCssVar('--color-border', '#2f2f2f'),
        textSubtle: getCssVar('--color-text', '#b3b3b3'),
        warning: getCssVar('--color-warning', '#f39c12'),
    });

    const buildMapElements = (includeUnreachable) => {
        const includedKeys = new Set(reachableSet);
        if (includeUnreachable) {
            unreachableSet.forEach((key) => includedKeys.add(key));
        }

        const nodes = (graph?.nodes ?? [])
            .filter((node) => includedKeys.has(node.canonicalKey))
            .map((node) => ({
                data: {
                    id: node.canonicalKey,
                    label: node.title,
                    group: node.group,
                    isRoot: node.canonicalKey === resolveRoot(),
                    isMultiParent: multiParentKeys.has(node.canonicalKey),
                    isUnreachable: unreachableSet.has(node.canonicalKey),
                    inCycle: cycleNodeSet.has(node.canonicalKey),
                },
                classes: [
                    'quest-node',
                    unreachableSet.has(node.canonicalKey) ? 'unreachable' : '',
                    multiParentKeys.has(node.canonicalKey) ? 'multi-parent' : '',
                    cycleNodeSet.has(node.canonicalKey) ? 'cycle' : '',
                    node.canonicalKey === resolveRoot() ? 'root' : '',
                ]
                    .filter(Boolean)
                    .join(' '),
            }));

        const allowedKeys = new Set(nodes.map((node) => node.data.id));
        const edges =
            graph?.edges
                ?.filter((edge) => allowedKeys.has(edge.from) && allowedKeys.has(edge.to))
                .map((edge) => ({
                    data: {
                        id: `${edge.from}->${edge.to}`,
                        source: edge.from,
                        target: edge.to,
                    },
                })) ?? [];

        return [...nodes, ...edges];
    };

    const applyMultiParentHighlight = () => {
        if (!cy) return;
        const nodes = cy.nodes('.multi-parent');
        if (highlightMultiParent) {
            nodes.addClass('emphasize');
        } else {
            nodes.removeClass('emphasize');
        }
    };

    const highlightFocus = (key) => {
        if (!cy) return;
        cy.nodes().removeClass('focused highlight-parent highlight-child');
        cy.edges().removeClass('highlighted');
        if (!key) return;
        const node = cy.getElementById(key);
        if (!node || node.empty()) return;
        node.addClass('focused');
        const incomingEdges = node.incomers('edge');
        incomingEdges.addClass('highlighted');
        incomingEdges.sources().addClass('highlight-parent');
        const outgoingEdges = node.outgoers('edge');
        outgoingEdges.addClass('highlighted');
        outgoingEdges.targets().addClass('highlight-child');
    };

    const runLayout = (options = {}) => {
        if (!cy) return;
        const layout = cy.layout({
            name: 'dagre',
            rankDir: 'TB',
            nodeSep: 60,
            edgeSep: 16,
            rankSep: 80,
            padding: 30,
        });
        layout.run();
        if (options.fit !== false) {
            cy.fit(undefined, 24);
        }
    };

    const refreshMap = (includeUnreachable) => {
        if (!cy) return;

        // Store current pan and zoom to preserve user's view
        const zoom = cy.zoom();
        const pan = cy.pan();

        cy.elements().remove();
        cy.add(buildMapElements(includeUnreachable));
        applyMultiParentHighlight();

        // Restore pan/zoom after layout completes (layout can be async)
        cy.once('layoutstop', () => {
            cy.zoom(zoom);
            cy.pan(pan);
            highlightFocus(focusedKey);
        });

        runLayout({ fit: false });
    };

    const initMap = async () => {
        if (!hasMounted || mapInitialized || activeTab !== 'map') return;
        mapStatus = 'loading';
        mapError = '';
        try {
            const [{ default: cytoscape }, { default: registerDagre }] = await Promise.all([
                import('cytoscape'),
                import('cytoscape-dagre'),
            ]);
            cytoscape.use(registerDagre);

            const colors = mapStyles();
            cy = cytoscape({
                container: mapContainer,
                elements: buildMapElements(showUnreachable),
                style: [
                    {
                        selector: 'core',
                        style: {
                            'selection-box-border-color': colors.nodeAccent,
                            'selection-box-background-color': 'rgba(104, 212, 109, 0.1)',
                        },
                    },
                    {
                        selector: 'node',
                        style: {
                            'background-color': colors.nodeFill,
                            'border-color': colors.nodeBorder,
                            'border-width': 2,
                            label: 'data(label)',
                            color: colors.nodeText,
                            'text-valign': 'center',
                            'text-wrap': 'wrap',
                            'text-max-width': 160,
                            'font-size': 12,
                            'font-weight': 600,
                            padding: '12px',
                            'text-outline-color': colors.nodeFill,
                            'text-outline-width': 2,
                            'shadow-blur': 12,
                            'shadow-color': 'rgba(0,0,0,0.35)',
                        },
                    },
                    {
                        selector: 'node.root',
                        style: {
                            'background-color': colors.nodeAccent,
                            color: colors.nodeAccentText,
                            'text-outline-color': colors.nodeAccent,
                        },
                    },
                    {
                        selector: 'node.multi-parent.emphasize',
                        style: {
                            'border-width': 4,
                            'border-color': colors.warning,
                            'text-outline-color': colors.nodeFill,
                            'text-outline-width': 3,
                        },
                    },
                    {
                        selector: 'node.cycle',
                        style: {
                            'background-image':
                                'linear-gradient(135deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)',
                            'background-size': '12px 12px',
                        },
                    },
                    {
                        selector: 'node.unreachable',
                        style: {
                            opacity: 0.6,
                            'border-style': 'dashed',
                        },
                    },
                    {
                        selector: 'edge',
                        style: {
                            width: 2,
                            'line-color': colors.textSubtle,
                            'target-arrow-color': colors.textSubtle,
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier',
                        },
                    },
                    {
                        selector: 'edge.highlighted',
                        style: {
                            width: 3,
                            'line-color': colors.nodeAccent,
                            'target-arrow-color': colors.nodeAccent,
                        },
                    },
                    {
                        selector: 'node.focused',
                        style: {
                            'border-width': 4,
                            'border-color': colors.nodeAccent,
                            'text-outline-color': colors.nodeAccent,
                        },
                    },
                    {
                        selector: 'node.highlight-parent',
                        style: {
                            'border-color': colors.nodeAccent,
                        },
                    },
                    {
                        selector: 'node.highlight-child',
                        style: {
                            'border-color': colors.nodeAccent,
                            'border-style': 'dotted',
                        },
                    },
                ],
                wheelSensitivity: 0.2,
                motionBlur: false,
            });

            cy.on('tap', 'node', (event) => {
                const nodeKey = event?.target?.id?.();
                if (nodeKey) {
                    setFocus(nodeKey);
                    highlightFocus(nodeKey);
                }
            });

            // Expose Cytoscape instance for E2E tests (DEV-only to avoid production leakage)
            if (
                typeof window !== 'undefined' &&
                (import.meta.env.DEV || import.meta.env.PUBLIC_ENABLE_QUEST_GRAPH_DEBUG === 'true')
            ) {
                window.__questGraphCy = cy;
            }

            applyMultiParentHighlight();
            runLayout();
            highlightFocus(focusedKey);
            mapInitialized = true;
            mapStatus = 'ready';
        } catch (error) {
            mapError =
                error instanceof Error && error.message ? error.message : 'Failed to load map view';
            mapStatus = 'error';
        }
    };

    $: if (hasMounted && activeTab === 'map') {
        initMap();
    }

    $: if (
        mapInitialized &&
        activeTab === 'map' &&
        showUnreachable !== undefined &&
        showUnreachable !== prevShowUnreachable
    ) {
        prevShowUnreachable = showUnreachable;
        refreshMap(showUnreachable);
    }

    $: if (mapInitialized && activeTab === 'map') {
        applyMultiParentHighlight();
    }

    $: if (mapInitialized && activeTab === 'map') {
        highlightFocus(focusedKey);
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
            <button class="pill" type="button" on:click={() => setFocus(resolveRoot())}>
                Root
            </button>
            <button class="pill" type="button" on:click={() => (searchOpen = true)}>
                Search
            </button>
        </div>
    </div>

    <div class="tab-bar" role="tablist" aria-label="Quest graph views">
        <button
            type="button"
            class:selected={activeTab === 'navigator'}
            role="tab"
            aria-selected={activeTab === 'navigator'}
            aria-controls="quest-graph-panel-navigator"
            id="quest-graph-tab-navigator"
            on:click={() => (activeTab = 'navigator')}
        >
            Navigator
        </button>
        <button
            type="button"
            class:selected={activeTab === 'map'}
            role="tab"
            aria-selected={activeTab === 'map'}
            aria-controls="quest-graph-panel-map"
            id="quest-graph-tab-map"
            on:click={() => (activeTab = 'map')}
        >
            Map
        </button>
        <button
            type="button"
            class:selected={activeTab === 'diagnostics'}
            role="tab"
            aria-selected={activeTab === 'diagnostics'}
            aria-controls="quest-graph-panel-diagnostics"
            id="quest-graph-tab-diagnostics"
            on:click={() => (activeTab = 'diagnostics')}
        >
            Diagnostics
        </button>
    </div>

    {#if activeTab === 'navigator'}
        <div
            role="tabpanel"
            id="quest-graph-panel-navigator"
            aria-labelledby="quest-graph-tab-navigator"
            tabindex="0"
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
                                        isRoot={key === resolveRoot()}
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
                <button
                    type="button"
                    on:click={() => setFocus(resolveRoot())}
                    aria-label="Go to root"
                >
                    Root
                </button>
                <button type="button" on:click={() => (searchOpen = true)} aria-label="Search">
                    Search
                </button>
            </div>
        </div>
    {:else if activeTab === 'map'}
        <div
            role="tabpanel"
            id="quest-graph-panel-map"
            aria-labelledby="quest-graph-tab-map"
            tabindex="0"
        >
            <div class="map-tools">
                <div class="toggles">
                    <label class:disabled={unreachableCount === 0}>
                        <input
                            type="checkbox"
                            bind:checked={showUnreachable}
                            disabled={unreachableCount === 0}
                            aria-label="Show unreachable quests"
                        />
                        Show unreachable ({unreachableCount})
                    </label>
                    {#if unreachableCount === 0}
                        <div class="hint-wrapper">
                            <span class="hint subtle">No unreachable quests detected</span>
                        </div>
                    {/if}
                    <label>
                        <input
                            type="checkbox"
                            bind:checked={highlightMultiParent}
                            aria-label="Highlight multi-parent quests"
                        />
                        Highlight multi-parent quests
                    </label>
                </div>
                <div class="legend">
                    <span class="legend-item">
                        <span class="chip root-chip" aria-hidden="true"></span> Root
                    </span>
                    <span class="legend-item">
                        <span class="chip standard-chip" aria-hidden="true"></span> Reachable
                    </span>
                    <span class="legend-item">
                        <span class="chip unreachable-chip" aria-hidden="true"></span> Unreachable
                    </span>
                    <span class="legend-item">
                        <span class="chip multi-chip" aria-hidden="true"></span> Multi-parent
                    </span>
                </div>
            </div>
            <div class="map-shell">
                {#if mapStatus === 'error'}
                    <p class="subtle">Map failed to load: {mapError}</p>
                {:else}
                    <div class="map-canvas" bind:this={mapContainer}>
                        {#if mapStatus === 'loading'}
                            <div class="map-overlay subtle">Loading map…</div>
                        {:else if !mapInitialized}
                            <div class="map-overlay subtle">Select Map to load the full graph</div>
                        {/if}
                    </div>
                {/if}
            </div>
            <p class="subtle hint">
                Tip: click a node to sync focus with Navigator. Scroll or pinch to zoom and drag to
                pan.
            </p>
        </div>
    {:else}
        <div
            role="tabpanel"
            id="quest-graph-panel-diagnostics"
            aria-labelledby="quest-graph-tab-diagnostics"
            tabindex="0"
        >
            <div class="diagnostics">
                <div class="diagnostics-header">
                    <div>
                        <p class="subtle">
                            Root: {rootKey || 'Not detected'} · Cycles: {diagnosticsView.counts
                                .cycles}
                        </p>
                        <p class="subtle">
                            Includes full diagnostics plus top {diagnosticsView.multiParentQuests
                                .length} multi-parent quests.
                        </p>
                    </div>
                    <div class="diag-actions">
                        <button
                            class="pill"
                            type="button"
                            data-testid="copy-diagnostics-report"
                            on:click={handleCopyReport}
                        >
                            Copy report
                        </button>
                        {#if copyFeedback}
                            <span class="copy-feedback subtle">{copyFeedback}</span>
                        {/if}
                    </div>
                </div>

                <div class="diag-summary" aria-label="Diagnostics summary">
                    <div class="summary-pill">
                        <span class="label">Missing refs</span>
                        <strong>{diagnosticsView.counts.missingRefs}</strong>
                    </div>
                    <div class="summary-pill">
                        <span class="label">Ambiguous refs</span>
                        <strong>{diagnosticsView.counts.ambiguousRefs}</strong>
                    </div>
                    <div class="summary-pill">
                        <span class="label">Unreachable</span>
                        <strong>{diagnosticsView.counts.unreachableNodes}</strong>
                    </div>
                    <div class="summary-pill">
                        <span class="label">Cycles</span>
                        <strong>{diagnosticsView.counts.cycles}</strong>
                    </div>
                    <div class="summary-pill">
                        <span class="label">Multi-parent</span>
                        <strong>{diagnosticsView.counts.multiParentQuests}</strong>
                    </div>
                </div>

                <div class="diag-grid">
                    <div>
                        <h4>Missing refs ({diagnosticsView.missingRefs.length})</h4>
                        {#if diagnosticsView.missingRefs.length === 0}
                            <p class="subtle">None</p>
                        {:else}
                            <ul>
                                {#each diagnosticsView.missingRefs as issue}
                                    <li>
                                        <div class="diag-item">
                                            <div class="diag-label">
                                                {issue.from} → {issue.ref}
                                            </div>
                                            <button
                                                type="button"
                                                on:click={() => jumpToNode(issue.from)}
                                            >
                                                Jump to node
                                            </button>
                                        </div>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                    <div>
                        <h4>Ambiguous refs ({diagnosticsView.ambiguousRefs.length})</h4>
                        {#if diagnosticsView.ambiguousRefs.length === 0}
                            <p class="subtle">None</p>
                        {:else}
                            <ul>
                                {#each diagnosticsView.ambiguousRefs as issue}
                                    <li>
                                        <div class="diag-item">
                                            <div>
                                                <div class="diag-label">
                                                    {issue.from} → {issue.ref} ({issue.candidates
                                                        .length} candidates)
                                                </div>
                                                <div class="diag-detail subtle">
                                                    Candidates: {issue.candidates.join(', ')}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                on:click={() => jumpToNode(issue.from)}
                                            >
                                                Jump to node
                                            </button>
                                        </div>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                    <div>
                        <h4>Unreachable ({diagnosticsView.unreachableNodes.length})</h4>
                        {#if diagnosticsView.unreachableNodes.length === 0}
                            <p class="subtle">None</p>
                        {:else}
                            <ul>
                                {#each diagnosticsView.unreachableNodes as key}
                                    <li>
                                        <div class="diag-item">
                                            <div class="diag-label">{key}</div>
                                            <button type="button" on:click={() => jumpToNode(key)}>
                                                Jump to node
                                            </button>
                                        </div>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                    <div>
                        <h4>Cycles ({diagnosticsView.cycles.length})</h4>
                        {#if diagnosticsView.cycles.length === 0}
                            <p class="subtle">None</p>
                        {:else}
                            <ul>
                                {#each diagnosticsView.cycles as cycle}
                                    <li>
                                        <div class="diag-item">
                                            <div class="diag-label">{cycle.join(' → ')}</div>
                                            <button
                                                type="button"
                                                on:click={() => jumpToNode(cycle[0])}
                                            >
                                                Jump to node
                                            </button>
                                        </div>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                </div>

                {#if diagnosticsView.multiParentQuests.length > 0}
                    <div class="diag-multi">
                        <h4>
                            Multi-parent quests (top {diagnosticsView.multiParentQuests.length})
                        </h4>
                        <ul>
                            {#each diagnosticsView.multiParentQuests as quest}
                                <li>
                                    <div class="diag-item stacked">
                                        <div>
                                            <div class="diag-label">{quest.title}</div>
                                            <div class="diag-detail subtle">
                                                {quest.canonicalKey} · Parents: {quest.requiresCount}
                                            </div>
                                            <div class="diag-detail subtle">
                                                Requires: {quest.requires.join(', ')}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            on:click={() => jumpToNode(quest.canonicalKey)}
                                        >
                                            Jump to node
                                        </button>
                                    </div>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}
            </div>
        </div>
    {/if}

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
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        min-width: 0;
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
        display: inline-flex;
        gap: 8px;
        border: 1px solid var(--color-border);
        border-radius: 12px;
        padding: 6px;
        margin-top: 12px;
    }

    .tab-bar button {
        background: transparent;
        color: var(--color-text);
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        transition:
            background 120ms ease,
            color 120ms ease;
    }

    .tab-bar button.selected {
        background: var(--color-pill);
        color: var(--color-pill-text);
        border: 1px solid var(--color-border);
    }

    [role='tabpanel'] {
        min-width: 0;
        max-width: 100%;
    }

    .shelves {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-top: 12px;
        min-width: 0;
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
        min-width: 0;
    }

    .cards {
        display: flex;
        flex-wrap: nowrap;
        gap: 10px;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        padding-bottom: 6px;
        max-width: 100%;
        min-width: 0;
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

    .diagnostics-header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
    }

    .diag-actions {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
    }

    .copy-feedback {
        font-size: 0.9rem;
    }

    .diag-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 10px;
        margin-top: 10px;
    }

    .summary-pill {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--color-border);
        border-radius: 10px;
        padding: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--color-heading);
    }

    .summary-pill .label {
        font-size: 0.95rem;
        color: var(--color-text);
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

    .diag-item {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: flex-start;
        background: rgba(0, 0, 0, 0.08);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 8px;
    }

    .diag-item.stacked {
        flex-direction: column;
    }

    .diag-item button {
        background: var(--color-pill);
        color: var(--color-pill-text);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 6px 10px;
        cursor: pointer;
        white-space: nowrap;
    }

    .diag-label {
        font-weight: 600;
        color: var(--color-heading);
        word-break: break-word;
    }

    .diag-detail {
        font-size: 0.9rem;
        word-break: break-word;
    }

    .diag-multi ul {
        list-style: none;
        padding: 0;
        margin: 8px 0 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .diag-multi {
        margin-top: 12px;
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

    .map-tools {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
    }

    .toggles {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        color: var(--color-heading);
        font-size: 0.95rem;
        align-items: flex-start;
    }

    .hint-wrapper {
        flex-basis: 100%;
        font-size: 0.85rem;
        color: var(--color-text-muted);
    }

    .toggles label.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .toggles label.disabled input {
        cursor: not-allowed;
    }

    .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        color: var(--color-text);
    }

    .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.9rem;
    }

    .chip {
        display: inline-block;
        width: 16px;
        height: 16px;
        border-radius: 6px;
        border: 1px solid var(--color-border);
    }

    .root-chip {
        background: var(--color-pill-active);
    }

    .standard-chip {
        background: var(--color-pill);
    }

    .unreachable-chip {
        background: rgba(255, 255, 255, 0.1);
        border-style: dashed;
    }

    .multi-chip {
        background: var(--color-pill);
        border: 2px solid var(--color-warning, #f39c12);
    }

    .map-shell {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        border: 1px solid var(--color-border);
        margin-top: 12px;
        position: relative;
    }

    .map-canvas {
        height: 520px;
        width: 100%;
        border-radius: 12px;
        overflow: hidden;
        position: relative;
    }

    .map-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.45);
        text-align: center;
        padding: 16px;
    }

    .hint {
        margin-top: 8px;
        font-size: 0.9rem;
    }

    @media (max-width: 720px) {
        .map-canvas {
            height: 400px;
        }
    }
</style>
