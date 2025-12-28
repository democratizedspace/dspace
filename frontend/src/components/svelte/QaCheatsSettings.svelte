<script>
    import { onMount } from 'svelte';
    import { initializeQaCheats, qaCheatsEnabled, setQaCheatsEnabled } from '../../lib/qaCheats';

    export let cheatsAvailable = false;

    let mounted = false;
    let cheatsEnabled = false;
    let unsubscribe = () => {};
    let cleanupCheats = () => {};

    const syncCheatsEnabled = (value) => {
        cheatsEnabled = Boolean(value) && cheatsAvailable;
    };

    const handleToggle = (event) => {
        const nextEnabled = event?.currentTarget?.checked ?? false;
        setQaCheatsEnabled(nextEnabled, cheatsAvailable);
    };

    onMount(() => {
        cleanupCheats = initializeQaCheats(cheatsAvailable);
        unsubscribe = qaCheatsEnabled.subscribe(syncCheatsEnabled);
        mounted = true;

        return () => {
            cleanupCheats?.();
            unsubscribe?.();
        };
    });

    $: if (!cheatsAvailable) {
        syncCheatsEnabled(false);
    }
</script>

{#if mounted && cheatsAvailable}
    <section class="qa-cheats" data-hydrated={mounted ? 'true' : 'false'}>
        <div class="heading">
            <h2>QA Cheats</h2>
            <p>Shows testing-only options like “Instant finish” for long-running processes.</p>
        </div>

        <label class="toggle">
            <input
                type="checkbox"
                role="switch"
                aria-checked={cheatsEnabled}
                checked={cheatsEnabled}
                on:change={handleToggle}
            />
            <span class="track" aria-hidden="true">
                <span class="thumb">QA</span>
            </span>
            <span class="label">Enable QA cheats</span>
        </label>
    </section>
{/if}

<style>
    .qa-cheats {
        border: 1px solid #1f2937;
        border-radius: 12px;
        padding: 1.5rem;
        display: grid;
        gap: 0.75rem;
        max-width: 640px;
        background: linear-gradient(135deg, rgba(31, 41, 55, 0.9), rgba(17, 24, 39, 0.8));
        color: #e5e7eb;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
    }

    .heading {
        display: grid;
        gap: 0.25rem;
    }

    .heading h2 {
        margin: 0;
        color: #e5e7eb;
    }

    .heading p {
        margin: 0;
        color: #cbd5e1;
    }

    .toggle {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 0.75rem;
        width: fit-content;
        padding: 0.35rem 0.5rem;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px dashed rgba(255, 255, 255, 0.2);
        cursor: pointer;
    }

    .toggle input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }

    .track {
        position: relative;
        width: 52px;
        height: 28px;
        border-radius: 999px;
        background: linear-gradient(120deg, #9a3412, #ea580c);
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
        transition:
            background 160ms ease,
            box-shadow 160ms ease;
        display: inline-flex;
        align-items: center;
        padding: 4px;
    }

    .thumb {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 999px;
        background: #fbbf24;
        color: #7c2d12;
        font-size: 0.65rem;
        font-weight: 800;
        text-transform: uppercase;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        transform: translateX(0);
        transition:
            transform 160ms ease,
            background 160ms ease,
            color 160ms ease;
        letter-spacing: 0.04em;
    }

    input:checked + .track {
        background: linear-gradient(120deg, #15803d, #22c55e);
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
    }

    input:checked + .track .thumb {
        transform: translateX(22px);
        background: #ecfeff;
        color: #0f172a;
    }

    .label {
        font-weight: 700;
        color: #f1f5f9;
    }

    .toggle:hover .track {
        box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(0, 0, 0, 0.3);
    }

    .toggle:focus-within {
        outline: 2px solid #22c55e;
        outline-offset: 3px;
    }
</style>
