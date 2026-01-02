<script>
    import { onMount, tick } from 'svelte';
    import QuestGraphCard from './QuestGraphCard.svelte';
    import {
        formatDiagnosticsReport,
        resolveRootKey,
    } from '../../lib/quests/questGraphDiagnostics';
    import { copyToClipboard } from '../../utils/copyToClipboard.js';

    export let graph;

    const byKey = graph?.byKey ?? {};
    let visualizerEl = null;
    let mapContainer = null;
    let searchInput = null;
    let resolvedRootKey = resolveRootKey(graph);

    let activeTab = 'navigator';
    let mapStatus = 'idle';
    let mapError = '';
    let showUnreachable = false;
    let prevShowUnreachable = showUnreachable;
    let highlightMultiParent = true;
    let mapInitialized = false;
    let cy = null;
    let layoutQueueHandle = null;
    let pendingLayoutOptions = { fit: false };
    let layoutRestoreHandler = null;
    let hasMounted = false;
    let copyStatus = 'idle';
    let copyError = '';
    let navigatorPanel = null;
    let mapPanel = null;
    let diagnosticsPanel = null;
    let navigatorTab = null;
    let mapTab = null;
    let diagnosticsTab = null;
    const tabOrder = ['navigator', 'map', 'diagnostics'];

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

    let focusedKey = resolvedRootKey;
    let searchOpen = false;
    let searchQuery = '';
    let parentCycleIndex = 0;
    let childCycleIndex = 0;
    const cards = new Map();
    let focusedBadges = [];
    const focusPanelForTab = (tab) => {
        const panel =
            tab === 'navigator' ? navigatorPanel : tab === 'map' ? mapPanel : diagnosticsPanel;
        if (panel?.focus) {
            panel.focus();
        }
    };
    const activateTab = async (tab, { focusPanel = true } = {}) => {
        activeTab = tab;
        await tick();
        if (focusPanel) {
            focusPanelForTab(tab);
        }
    };
    const getTabRef = (tab) =>
        tab === 'navigator' ? navigatorTab : tab === 'map' ? mapTab : diagnosticsTab;
    const focusTabButton = (tab) => {
        const ref = getTabRef(tab);
        if (ref?.focus) {
            ref.focus();
        }
    };
    const moveTabFocus = async (direction) => {
        const currentIndex = tabOrder.indexOf(activeTab);
        const delta = direction === 'next' ? 1 : -1;
        const nextIndex = (currentIndex + delta + tabOrder.length) % tabOrder.length;
        const nextTab = tabOrder[nextIndex];
        await activateTab(nextTab, { focusPanel: false });
        focusTabButton(nextTab);
    };
    const handleTabKeydown = (event, tab) => {
        if (event.key === 'ArrowRight') {
            event.stopPropagation();
            event.preventDefault();
            moveTabFocus('next');
            return;
        }

        if (event.key === 'ArrowLeft') {
            event.stopPropagation();
            event.preventDefault();
            moveTabFocus('prev');
            return;
        }

        if (event.key === ' ' || event.key === 'Enter') {
            event.stopPropagation();
            event.preventDefault();
            activateTab(tab);
        }
    };
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
    const jumpToNode = async (key) => {
        if (!key) return;
        if (activeTab !== 'navigator') {
            await activateTab('navigator');
        }
        await setFocus(key);
    };

    $: resolvedRootKey = resolveRootKey(graph);
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
    $: focusedBadges = !focusedNode
        ? []
        : [
              focusedKey === resolvedRootKey ? 'Root' : null,
              multiParentKeys.has(focusedKey) ? 'Multi-parent' : null,
              unreachableSet.has(focusedKey) ? 'Unreachable' : null,
              cycleNodeSet.has(focusedKey) ? 'Cycle' : null,
          ].filter(Boolean);
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
        const isMapToggleTarget = target === mapPanel || target === mapTab;
        const isNavigatorToggleTarget = target === navigatorPanel || target === navigatorTab;
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

        if (event.key === 'Enter' && activeTab === 'map' && isMapToggleTarget) {
            event.preventDefault();
            activateTab('navigator');
            return;
        }

        if (event.key === 'Enter' && activeTab === 'navigator' && isNavigatorToggleTarget) {
            event.preventDefault();
            activateTab('map');
            return;
        }

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
        copyError = '';
        try {
            const report = formatDiagnosticsReport(graph);
            await copyToClipboard(report);
            copyStatus = 'copied';
            setTimeout(() => {
                copyStatus = 'idle';
            }, 2000);
        } catch (error) {
            copyStatus = 'idle';
            copyError =
                error instanceof Error && error.message ? error.message : 'Failed to copy report';
        }
    };

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
        setFocus(focusedKey);
        hasMounted = true;
        return () => {
            window.removeEventListener('keydown', handleKeydown);
            cancelQueuedLayout();
            if (layoutRestoreHandler) {
                cy?.off?.('layoutstop', layoutRestoreHandler);
                layoutRestoreHandler = null;
            }
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
                    isRoot: node.canonicalKey === resolvedRootKey,
                    isMultiParent: multiParentKeys.has(node.canonicalKey),
                    isUnreachable: unreachableSet.has(node.canonicalKey),
                    inCycle: cycleNodeSet.has(node.canonicalKey),
                },
                classes: [
                    'quest-node',
                    unreachableSet.has(node.canonicalKey) ? 'unreachable' : '',
                    multiParentKeys.has(node.canonicalKey) ? 'multi-parent' : '',
                    cycleNodeSet.has(node.canonicalKey) ? 'cycle' : '',
                    node.canonicalKey === resolvedRootKey ? 'root' : '',
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
        if (options.fit) {
            cy.fit(undefined, 24);
        }
    };

    const cancelQueuedLayout = () => {
        if (!layoutQueueHandle) return;
        if (layoutQueueHandle.type === 'raf') {
            if (typeof cancelAnimationFrame === 'function') {
                cancelAnimationFrame(layoutQueueHandle.id);
            }
        } else if (layoutQueueHandle.type === 'timeout') {
            clearTimeout(layoutQueueHandle.id);
        } else {
            layoutQueueHandle.cancel?.();
        }
        layoutQueueHandle = null;
    };

    const queueLayout = (options = {}) => {
        if (!cy) return;
        pendingLayoutOptions = {
            ...pendingLayoutOptions,
            ...options,
            fit: options.fit ?? pendingLayoutOptions.fit ?? false,
        };

        if (layoutQueueHandle) return;

        const flush = () => {
            layoutQueueHandle = null;
            const nextOptions = pendingLayoutOptions;
            pendingLayoutOptions = { fit: false };
            runLayout(nextOptions);
        };

        const useRaf = typeof requestAnimationFrame === 'function';

        if (useRaf) {
            const handle = requestAnimationFrame(flush);
            layoutQueueHandle = {
                id: handle,
                type: 'raf',
                cancel:
                    typeof cancelAnimationFrame === 'function'
                        ? () => cancelAnimationFrame(handle)
                        : null,
            };
            return;
        }

        const handle = setTimeout(flush, 0);
        layoutQueueHandle = {
            id: handle,
            type: 'timeout',
            cancel: () => clearTimeout(handle),
        };
    };

    const restoreViewportAfterLayout = (viewport) => {
        if (!cy || !viewport) return;
        if (layoutRestoreHandler) {
            cy.off('layoutstop', layoutRestoreHandler);
        }
        layoutRestoreHandler = () => {
            cy.zoom(viewport.zoom);
            cy.pan(viewport.pan);
            highlightFocus(focusedKey);
            layoutRestoreHandler = null;
        };
        cy.once('layoutstop', layoutRestoreHandler);
    };

    const refreshMap = (includeUnreachable) => {
        if (!cy) return;

        // Store current pan and zoom to preserve user's view
        const zoom = cy.zoom();
        const pan = cy.pan();
        const viewport = { zoom, pan };

        cy.elements().remove();
        cy.add(buildMapElements(includeUnreachable));
        applyMultiParentHighlight();

        restoreViewportAfterLayout(viewport);
        queueLayout();
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
                wheelSensitivity: 0.6,
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
            queueLayout({ fit: true });
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

    const fitGraph = () => {
        if (!cy) return;
        cy.fit(undefined, 24);
    };

    const centerOnFocused = () => {
        if (!cy || !focusedKey) return;
        const node = cy.getElementById(focusedKey);
        if (!node || node.empty()) return;
        cy.center(node);
        highlightFocus(focusedKey);
    };
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
            <button class="pill" type="button" on:click={() => setFocus(resolvedRootKey)}>
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
            tabindex={activeTab === 'navigator' ? 0 : -1}
            on:click={() => activateTab('navigator')}
            on:keydown={(event) => handleTabKeydown(event, 'navigator')}
            bind:this={navigatorTab}
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
            tabindex={activeTab === 'map' ? 0 : -1}
            on:click={() => activateTab('map')}
            on:keydown={(event) => handleTabKeydown(event, 'map')}
            bind:this={mapTab}
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
            tabindex={activeTab === 'diagnostics' ? 0 : -1}
            on:click={() => activateTab('diagnostics')}
            on:keydown={(event) => handleTabKeydown(event, 'diagnostics')}
            bind:this={diagnosticsTab}
        >
            Diagnostics
        </button>
    </div>

    {#if activeTab === 'navigator'}
        <div
            role="tabpanel"
            id="quest-graph-panel-navigator"
            aria-labelledby="quest-graph-tab-navigator"
            tabindex="-1"
            bind:this={navigatorPanel}
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
                                        isRoot={key === resolvedRootKey}
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
                    on:click={() => setFocus(resolvedRootKey)}
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
            tabindex="-1"
            bind:this={mapPanel}
            data-testid="quest-graph-panel-map"
        >
            <div
                class="focused-strip"
                role="status"
                aria-live="polite"
                aria-atomic="true"
                data-testid="focused-quest-strip"
            >
                <div class="strip-text">
                    <p class="strip-label">Focused quest</p>
                    <div class="strip-title" data-testid="focused-quest-title">
                        {focusedNode ? focusedNode.title : 'Select a quest'}
                    </div>
                    <p class="strip-key" data-testid="focused-quest-key">
                        {focusedNode ? focusedNode.canonicalKey : 'No quest focused'}
                    </p>
                </div>
                {#if focusedBadges.length}
                    <div class="strip-badges" aria-hidden="true">
                        {#each focusedBadges as badge}
                            <span class="strip-badge">{badge}</span>
                        {/each}
                    </div>
                {/if}
            </div>
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
                <div class="map-actions">
                    <button type="button" on:click={fitGraph} class="pill ghost">
                        Fit graph
                    </button>
                    <button type="button" on:click={centerOnFocused} class="pill ghost">
                        Center on focused
                    </button>
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
            tabindex="-1"
            bind:this={diagnosticsPanel}
        >
            <div class="diagnostics">
                <div class="diagnostics-toolbar">
                    <div>
                        <h4>Diagnostics</h4>
                        <p class="subtle">Jump to nodes or copy a full report for QA.</p>
                    </div>
                    <div class="diag-actions">
                        <button
                            type="button"
                            class="pill"
                            data-testid="copy-diagnostics-report"
                            on:click={handleCopyReport}
                        >
                            Copy report
                        </button>
                        {#if copyStatus === 'copied'}
                            <span class="status success" aria-live="polite">Copied</span>
                        {/if}
                        {#if copyError}
                            <span class="status error" aria-live="assertive">{copyError}</span>
                        {/if}
                    </div>
                </div>
                <div class="diag-grid">
                    <div>
                        <h4>Missing refs ({graph.diagnostics.missingRefs.length})</h4>
                        {#if graph.diagnostics.missingRefs.length === 0}
                            <p class="subtle">None</p>
                        {:else}
                            <ul>
                                {#each graph.diagnostics.missingRefs as issue}
                                    <li>
                                        <div class="diag-item">
                                            <span class="diag-text">{issue.from} → {issue.ref}</span
                                            >
                                            <button
                                                type="button"
                                                aria-label={`Jump to node ${issue.from}`}
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
                        <h4>Ambiguous refs ({graph.diagnostics.ambiguousRefs.length})</h4>
                        {#if graph.diagnostics.ambiguousRefs.length === 0}
                            <p class="subtle">None</p>
                        {:else}
                            <ul>
                                {#each graph.diagnostics.ambiguousRefs as issue}
                                    <li>
                                        <div class="diag-item">
                                            <span class="diag-text">
                                                {issue.from} → {issue.ref} ({issue.candidates
                                                    .length} candidates)
                                            </span>
                                            <button
                                                type="button"
                                                aria-label={`Jump to node ${issue.from}`}
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
                        <h4>Unreachable ({graph.diagnostics.unreachableNodes.length})</h4>
                        {#if graph.diagnostics.unreachableNodes.length === 0}
                            <p class="subtle">None</p>
                        {:else}
                            <ul>
                                {#each graph.diagnostics.unreachableNodes as key}
                                    <li>
                                        <div class="diag-item">
                                            <span class="diag-text">{key}</span>
                                            <button
                                                type="button"
                                                aria-label={`Jump to node ${key}`}
                                                on:click={() => jumpToNode(key)}
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
                        <h4>Cycles ({graph.diagnostics.cycles.length})</h4>
                        {#if graph.diagnostics.cycles.length === 0}
                            <p class="subtle">None</p>
                        {:else}
                            <ul>
                                {#each graph.diagnostics.cycles as cycle}
                                    <li>
                                        <div class="diag-item">
                                            <span class="diag-text">{cycle.join(' → ')}</span>
                                            <button
                                                type="button"
                                                aria-label={`Jump to node ${cycle[0]}`}
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

    .diagnostics-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        flex-wrap: wrap;
    }

    .diag-actions {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
    }

    .status {
        font-weight: 600;
    }

    .status.success {
        color: var(--color-pill-active);
    }

    .status.error {
        color: var(--color-warning, #f39c12);
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
        align-items: center;
        gap: 10px;
        justify-content: space-between;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 8px 10px;
    }

    .diag-text {
        flex: 1;
        color: var(--color-heading);
        word-break: break-word;
        min-width: 0;
    }

    .diag-item button {
        background: var(--color-pill);
        color: var(--color-pill-text);
        border: 1px solid var(--color-border);
        border-radius: 6px;
        padding: 6px 10px;
        cursor: pointer;
        white-space: nowrap;
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

    .focused-strip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background: rgba(0, 0, 0, 0.12);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        padding: 10px 12px;
        margin-top: 12px;
    }

    .strip-text {
        min-width: 0;
    }

    .strip-label {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.85rem;
        color: var(--color-pill-text);
        margin: 0 0 4px 0;
    }

    .strip-title {
        font-weight: 700;
        color: var(--color-heading);
        margin: 0;
        word-break: break-word;
    }

    .strip-key {
        margin: 2px 0 0;
        color: var(--color-text);
        font-size: 0.95rem;
        word-break: break-word;
    }

    .strip-badges {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
    }

    .strip-badge {
        background: var(--color-pill);
        color: var(--color-pill-text);
        border: 1px solid var(--color-border);
        border-radius: 10px;
        padding: 4px 10px;
        font-size: 0.82rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
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

    .map-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .pill.ghost {
        background: transparent;
        color: var(--color-heading);
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
