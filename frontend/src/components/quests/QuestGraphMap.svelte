<script>
    import { onDestroy, onMount } from 'svelte';

    export let graph;
    export let focusedKey = '';
    export let reachableKeys = [];
    export let unreachableKeys = [];
    export let onFocus = () => {};
    export let isActive = false;

    let containerEl;
    let cy;
    let loading = false;
    let loadError = '';
    let showUnreachable = false;
    let highlightMultiParent = true;
    let relayoutHandle;

    let reachableSet = new Set(reachableKeys ?? []);
    let unreachableSet = new Set(unreachableKeys ?? []);
    let multiParentSet = new Set(
        graph?.nodes
            ?.filter((node) => (node.requires?.length ?? 0) > 1)
            .map((node) => node.canonicalKey) ?? []
    );

    $: reachableSet = new Set(reachableKeys ?? []);
    $: unreachableSet = new Set(unreachableKeys ?? []);
    $: multiParentSet = new Set(
        graph?.nodes
            ?.filter((node) => (node.requires?.length ?? 0) > 1)
            .map((node) => node.canonicalKey) ?? []
    );

    const truncate = (text, limit = 36) => {
        if (!text || text.length <= limit) return text;
        return `${text.slice(0, limit - 1)}…`;
    };

    const layoutOptions = {
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 60,
        rankSep: 110,
        edgeSep: 24,
        fit: true,
        animate: false,
    };

    const cyStyles = [
        {
            selector: 'node',
            style: {
                'background-color': 'var(--color-pill)',
                'border-color': 'var(--color-border)',
                'border-width': 2,
                'border-opacity': 0.8,
                label: 'data(label)',
                color: 'var(--color-heading)',
                'font-size': 12,
                'font-weight': 600,
                'text-valign': 'center',
                'text-halign': 'center',
                'text-wrap': 'wrap',
                'text-max-width': 160,
                padding: '12px',
                'text-outline-color': 'var(--color-pill)',
                'text-outline-width': 2,
                'shadow-color': 'rgba(0, 0, 0, 0.35)',
                'shadow-blur': 8,
                'shadow-opacity': 0.6,
            },
        },
        {
            selector: 'node.focused',
            style: {
                'border-color': 'var(--color-pill-active)',
                'border-width': 3,
                'shadow-color': 'rgba(104, 212, 109, 0.5)',
                'shadow-blur': 14,
                'shadow-opacity': 0.9,
            },
        },
        {
            selector: 'node.unreachable',
            style: {
                'background-color': 'rgba(255, 255, 255, 0.08)',
                'border-color': 'var(--color-border)',
                color: 'var(--color-text)',
                'text-outline-color': 'rgba(0, 0, 0, 0.45)',
            },
        },
        {
            selector: 'node.multi-parent',
            style: {
                'border-style': 'dashed',
                'border-color': 'var(--color-pill-active)',
            },
        },
        {
            selector: 'node.parent-node',
            style: {
                'background-color': 'rgba(104, 212, 109, 0.12)',
                'border-color': 'var(--color-pill-active)',
            },
        },
        {
            selector: 'node.child-node',
            style: {
                'background-color': 'rgba(255, 255, 255, 0.08)',
                'border-color': 'var(--color-pill)',
            },
        },
        {
            selector: 'edge',
            style: {
                'curve-style': 'bezier',
                'target-arrow-shape': 'triangle',
                'target-arrow-color': 'var(--color-border)',
                'line-color': 'var(--color-border)',
                width: 2,
                opacity: 0.75,
            },
        },
        {
            selector: 'edge.highlighted',
            style: {
                'line-color': 'var(--color-pill-active)',
                'target-arrow-color': 'var(--color-pill-active)',
                width: 3,
                opacity: 1,
            },
        },
    ];

    const shouldIncludeNode = (key) => showUnreachable || reachableSet.has(key);

    const buildElements = () => {
        const nodes = (graph?.nodes ?? []).filter((node) => shouldIncludeNode(node.canonicalKey));
        const nodeElements = nodes.map((node) => {
            const unreachable = unreachableSet.has(node.canonicalKey);
            const classes = [];
            if (unreachable) classes.push('unreachable');
            if (highlightMultiParent && multiParentSet.has(node.canonicalKey)) {
                classes.push('multi-parent');
            }
            return {
                data: {
                    id: node.canonicalKey,
                    label: truncate(node.title),
                },
                classes: classes.join(' '),
            };
        });

        const nodeSet = new Set(nodeElements.map((entry) => entry.data.id));
        const edgeElements =
            graph?.edges
                ?.filter((edge) => nodeSet.has(edge.from) && nodeSet.has(edge.to))
                .map((edge) => ({
                    data: {
                        id: `${edge.from}->${edge.to}`,
                        source: edge.from,
                        target: edge.to,
                    },
                })) ?? [];

        return [...nodeElements, ...edgeElements];
    };

    const applySelection = () => {
        if (!cy) return;
        cy.nodes().removeClass('focused parent-node child-node');
        cy.edges().removeClass('highlighted');

        if (!focusedKey) return;

        const target = cy.getElementById(focusedKey);
        if (!target || target.empty()) return;

        target.addClass('focused');

        const incomingEdges = target.incomers('edge');
        const outgoingEdges = target.outgoers('edge');
        incomingEdges.addClass('highlighted');
        outgoingEdges.addClass('highlighted');

        incomingEdges.sources().addClass('parent-node');
        outgoingEdges.targets().addClass('child-node');
    };

    const scheduleRelayout = () => {
        if (!cy) return;
        clearTimeout(relayoutHandle);
        relayoutHandle = setTimeout(() => {
            if (!cy) return;
            cy.elements().remove();
            cy.add(buildElements());
            cy.layout(layoutOptions).run();
            applySelection();
        }, 80);
    };

    const initCy = async () => {
        if (!containerEl || cy || loading) return;
        loading = true;
        loadError = '';
        try {
            const [{ default: cytoscape }, dagreImport] = await Promise.all([
                import('cytoscape'),
                import('cytoscape-dagre'),
            ]);
            const dagre = dagreImport?.default ?? dagreImport;
            if (dagre) {
                cytoscape.use(dagre);
            }

            cy = cytoscape({
                container: containerEl,
                elements: buildElements(),
                layout: layoutOptions,
                style: cyStyles,
                minZoom: 0.15,
                maxZoom: 2.5,
                wheelSensitivity: 0.2,
                pixelRatio: 1,
            });

            cy.on('tap', 'node', (event) => {
                const id = event.target.id();
                if (id) {
                    onFocus?.(id);
                }
            });

            applySelection();
        } catch (error) {
            loadError = error instanceof Error ? error.message : String(error);
        } finally {
            loading = false;
        }
    };

    onMount(() => {
        if (isActive) {
            initCy();
        }
    });

    onDestroy(() => {
        cy?.destroy();
        cy = undefined;
        clearTimeout(relayoutHandle);
    });

    $: if (cy && isActive) {
        cy.resize();
    }

    $: if (isActive && containerEl && !cy && !loading) {
        initCy();
    }

    $: if (cy && (showUnreachable || highlightMultiParent)) {
        scheduleRelayout();
    }

    $: if (cy || focusedKey) {
        applySelection();
    }
</script>

<div class="map-panel" data-active={isActive}>
    <div class="map-controls">
        <div class="toggles">
            <label>
                <input
                    type="checkbox"
                    bind:checked={showUnreachable}
                    aria-label="Toggle unreachable nodes"
                />
                Show unreachable
            </label>
            <label>
                <input
                    type="checkbox"
                    bind:checked={highlightMultiParent}
                    aria-label="Toggle multi-parent highlight"
                />
                Highlight multi-parent
            </label>
        </div>
        <div class="legend">
            <span class="legend-item">
                <span class="chip root"></span> Focused / root
            </span>
            <span class="legend-item">
                <span class="chip multi"></span> Multi-parent
            </span>
            <span class="legend-item">
                <span class="chip unreachable"></span> Unreachable
            </span>
        </div>
    </div>

    {#if loadError}
        <p class="subtle error">Unable to load map: {loadError}</p>
    {:else}
        <div class="map-canvas" bind:this={containerEl} data-loading={loading}>
            {#if loading}
                <div class="loading">Loading map…</div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .map-panel {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        padding: 12px;
        border: 1px solid var(--color-border);
    }

    .map-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }

    .toggles {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
    }

    .toggles label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--color-heading);
        font-size: 0.95rem;
    }

    .legend {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        color: var(--color-text);
        font-size: 0.9rem;
    }

    .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    .chip {
        width: 16px;
        height: 10px;
        border-radius: 999px;
        display: inline-block;
        border: 1px solid var(--color-border);
        background: var(--color-pill);
    }

    .chip.root {
        box-shadow: 0 0 0 2px rgba(104, 212, 109, 0.4);
    }

    .chip.multi {
        background: var(--color-pill-active);
    }

    .chip.unreachable {
        background: rgba(255, 255, 255, 0.08);
    }

    .map-canvas {
        position: relative;
        border: 1px dashed var(--color-border);
        border-radius: 10px;
        min-height: 420px;
        background:
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.04), transparent 35%),
            radial-gradient(circle at 80% 40%, rgba(255, 255, 255, 0.06), transparent 38%),
            var(--color-surface);
        overflow: hidden;
    }

    .map-canvas[data-loading='true'] {
        display: grid;
        place-items: center;
    }

    .loading {
        color: var(--color-heading);
        font-weight: 600;
        text-align: center;
        padding: 20px;
    }

    .subtle.error {
        color: #f8d7da;
    }
</style>
