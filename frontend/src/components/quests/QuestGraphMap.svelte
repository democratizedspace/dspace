<script>
    import { createEventDispatcher, onDestroy, onMount } from 'svelte';

    export let graph;
    export let focusedKey;

    const dispatch = createEventDispatcher();

    let containerEl = null;
    let cy = null;
    let loading = false;
    let error = '';
    let showUnreachable = false;
    let highlightMultiParent = true;

    const unreachableSet = new Set(graph?.diagnostics?.unreachableNodes ?? []);
    const cycleNodeSet = new Set(
        (graph?.diagnostics?.cycles ?? []).flatMap((cycle) => cycle ?? [])
    );

    const truncateLabel = (label) => {
        const trimmed = (label ?? '').trim();
        if (trimmed.length <= 32) return trimmed;
        return `${trimmed.slice(0, 29)}…`;
    };

    const buildElements = () => {
        const includedNodes = new Set(
            (graph?.nodes ?? [])
                .filter((node) => showUnreachable || !unreachableSet.has(node.canonicalKey))
                .map((node) => node.canonicalKey)
        );

        const elements = [];
        for (const node of graph?.nodes ?? []) {
            if (!includedNodes.has(node.canonicalKey)) continue;
            const classes = [];
            if (unreachableSet.has(node.canonicalKey)) classes.push('unreachable');
            if (highlightMultiParent && (node.requires?.length ?? 0) > 1) {
                classes.push('multi-parent');
            }
            if (cycleNodeSet.has(node.canonicalKey)) classes.push('cycle');

            elements.push({
                data: {
                    id: node.canonicalKey,
                    label: truncateLabel(node.title),
                    canonicalKey: node.canonicalKey,
                    group: node.group,
                },
                classes: classes.join(' '),
            });
        }

        for (const edge of graph?.edges ?? []) {
            if (!includedNodes.has(edge.from) || !includedNodes.has(edge.to)) continue;
            const classes = [];
            if (unreachableSet.has(edge.from) || unreachableSet.has(edge.to)) {
                classes.push('unreachable');
            }
            elements.push({
                data: {
                    id: `${edge.from}->${edge.to}`,
                    source: edge.from,
                    target: edge.to,
                },
                classes: classes.join(' '),
            });
        }

        return elements;
    };

    const runLayout = () => {
        if (!cy) return;
        cy.layout({
            name: 'dagre',
            rankDir: 'TB',
            padding: 24,
            nodeSep: 40,
            rankSep: 80,
        }).run();
    };

    const updateFocusHighlight = (key) => {
        if (!cy) return;
        cy.elements().removeClass('is-focus parent child highlighted');
        const target = cy.getElementById(key);
        if (!target || target.empty()) return;
        target.addClass('is-focus');
        target.incomers('edge').addClass('parent');
        target.incomers('node').addClass('parent');
        target.outgoers('edge').addClass('child');
        target.outgoers('node').addClass('child');
        target.connectedEdges().forEach((edge) => edge.addClass('highlighted'));
    };

    const refreshGraph = () => {
        if (!cy) return;
        cy.json({ elements: buildElements() });
        runLayout();
        updateFocusHighlight(focusedKey);
    };

    const bootstrap = async () => {
        if (!containerEl || cy) return;
        loading = true;
        try {
            const [{ default: cytoscape }, { default: dagre }] = await Promise.all([
                import('cytoscape'),
                import('cytoscape-dagre'),
            ]);
            cytoscape.use(dagre);
            cy = cytoscape({
                container: containerEl,
                elements: buildElements(),
                layout: { name: 'dagre', rankDir: 'TB', padding: 24 },
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': 'var(--color-pill)',
                            'border-color': 'var(--color-border)',
                            'border-width': 2,
                            color: 'var(--color-pill-text)',
                            label: 'data(label)',
                            'text-wrap': 'wrap',
                            'text-max-width': 120,
                            'font-size': 12,
                            'font-weight': 700,
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'text-outline-color': 'rgba(0,0,0,0.45)',
                            'text-outline-width': 2,
                        },
                    },
                    {
                        selector: 'node.unreachable',
                        style: {
                            'background-color': 'rgba(255,255,255,0.16)',
                            'border-color': 'rgba(255,255,255,0.35)',
                            color: 'var(--color-heading)',
                        },
                    },
                    {
                        selector: 'node.multi-parent',
                        style: {
                            'border-color': 'var(--color-pill-active)',
                            'border-width': 4,
                            'box-shadow': '0 0 0 2px rgba(104, 212, 109, 0.35)',
                        },
                    },
                    {
                        selector: 'node.cycle',
                        style: {
                            'border-style': 'dashed',
                            'border-color': '#ff9f43',
                        },
                    },
                    {
                        selector: 'node.is-focus',
                        style: {
                            'background-color': 'var(--color-pill-active)',
                            color: 'var(--color-pill-active-text)',
                            'border-color': 'var(--color-border)',
                            'box-shadow': '0 0 0 4px rgba(104, 212, 109, 0.45)',
                        },
                    },
                    {
                        selector: 'node.parent',
                        style: {
                            'border-color': '#5bc0ff',
                            'border-width': 3,
                        },
                    },
                    {
                        selector: 'node.child',
                        style: {
                            'border-color': '#dba6ff',
                            'border-width': 3,
                        },
                    },
                    {
                        selector: 'edge',
                        style: {
                            width: 2,
                            'curve-style': 'bezier',
                            'target-arrow-shape': 'triangle',
                            'line-color': 'rgba(255,255,255,0.45)',
                            'target-arrow-color': 'rgba(255,255,255,0.45)',
                        },
                    },
                    {
                        selector: 'edge.unreachable',
                        style: {
                            'line-color': 'rgba(255,255,255,0.25)',
                            'target-arrow-color': 'rgba(255,255,255,0.25)',
                        },
                    },
                    {
                        selector: 'edge.highlighted',
                        style: {
                            'line-color': 'var(--color-pill-active)',
                            'target-arrow-color': 'var(--color-pill-active)',
                            width: 3,
                        },
                    },
                ],
                wheelSensitivity: 0.15,
            });

            cy.on('tap', 'node', (event) => {
                const key = event.target.id();
                dispatch('focusNode', key);
                updateFocusHighlight(key);
            });

            runLayout();
            updateFocusHighlight(focusedKey);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            error = `Failed to load map view: ${message}`;
        } finally {
            loading = false;
        }
    };

    onMount(() => {
        bootstrap();
    });

    onDestroy(() => {
        cy?.destroy();
        cy = null;
    });

    $: if (cy) {
        cy.resize();
    }

    $: if (cy && focusedKey) {
        updateFocusHighlight(focusedKey);
    }
</script>

<div class="map-wrapper">
    <div class="map-toolbar">
        <div class="toggles">
            <label>
                <input
                    type="checkbox"
                    bind:checked={showUnreachable}
                    on:change={refreshGraph}
                    aria-label="Show unreachable nodes"
                />
                Show unreachable
            </label>
            <label>
                <input
                    type="checkbox"
                    bind:checked={highlightMultiParent}
                    on:change={refreshGraph}
                    aria-label="Highlight multi-parent nodes"
                />
                Highlight multi-parent
            </label>
        </div>
        <div class="legend" aria-label="Map legend">
            <span class="legend-item">
                <span class="chip focus"></span>
                Focused
            </span>
            <span class="legend-item">
                <span class="chip parent"></span>
                Parents
            </span>
            <span class="legend-item">
                <span class="chip child"></span>
                Children
            </span>
            <span class="legend-item">
                <span class="chip multi"></span>
                Multi-parent
            </span>
            <span class="legend-item">
                <span class="chip cycle"></span>
                Cycle
            </span>
            <span class="legend-item">
                <span class="chip unreachable"></span>
                Unreachable
            </span>
        </div>
    </div>

    {#if loading}
        <p class="subtle">Loading map…</p>
    {:else if error}
        <p class="error">{error}</p>
    {:else}
        <div class="map-surface" bind:this={containerEl} aria-label="Quest dependency map" />
    {/if}
</div>

<style>
    .map-wrapper {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .map-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        background: rgba(0, 0, 0, 0.08);
        border: 1px solid var(--color-border);
        border-radius: 10px;
        padding: 10px 12px;
    }

    .toggles {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        color: var(--color-heading);
    }

    .toggles label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.95rem;
    }

    .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        color: var(--color-heading);
    }

    .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.9rem;
        opacity: 0.9;
    }

    .chip {
        width: 14px;
        height: 14px;
        border-radius: 999px;
        display: inline-block;
        border: 1px solid var(--color-border);
    }

    .chip.focus {
        background: var(--color-pill-active);
    }

    .chip.parent {
        background: #5bc0ff;
    }

    .chip.child {
        background: #dba6ff;
    }

    .chip.multi {
        background: var(--color-pill);
        box-shadow: 0 0 0 2px rgba(104, 212, 109, 0.35);
    }

    .chip.cycle {
        background: #ff9f43;
    }

    .chip.unreachable {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.35);
    }

    .map-surface {
        min-height: 520px;
        width: 100%;
        background:
            radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.05), transparent 40%),
            radial-gradient(circle at 80% 0%, rgba(104, 212, 109, 0.08), transparent 45%),
            rgba(0, 0, 0, 0.12);
        border: 1px solid var(--color-border);
        border-radius: 12px;
    }

    .subtle {
        color: var(--color-text);
        opacity: 0.8;
    }

    .error {
        color: #ff9f43;
    }
</style>
