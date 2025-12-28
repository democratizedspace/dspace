<script>
    import { onDestroy, onMount } from 'svelte';
    import {
        cheatsAvailable as cheatsAvailableStore,
        cheatsEnabled,
        setCheatsAvailable,
        setCheatsEnabled,
    } from '../../stores/qaCheats';

    export let cheatsAvailable = false;

    let available = false;
    let enabled = false;
    let hydrated = false;

    const unsubscribeAvailability = cheatsAvailableStore.subscribe((value) => {
        available = value;
    });
    const unsubscribeEnabled = cheatsEnabled.subscribe((value) => {
        enabled = value;
    });

    onMount(() => {
        setCheatsAvailable(cheatsAvailable);
        hydrated = true;
    });

    onDestroy(() => {
        unsubscribeAvailability();
        unsubscribeEnabled();
    });

    $: effectiveEnabled = available && enabled;

    const toggleCheats = () => {
        setCheatsEnabled(!enabled);
    };
</script>

<section class="qa-cheats" data-hydrated={hydrated ? 'true' : 'false'}>
    <div class="heading">
        <h2>QA Cheats</h2>
        <p>
            Shows testing-only options like ‘Instant finish’ for long-running processes. Setting is
            stored on this device.
        </p>
    </div>

    <label class="toggle">
        <input
            type="checkbox"
            role="switch"
            aria-checked={effectiveEnabled}
            on:change={toggleCheats}
            checked={effectiveEnabled}
            data-testid="qa-cheats-toggle"
        />
        <div class="toggle-copy">
            <span class="label">Enable QA cheats</span>
            <span id="qa-cheats-helper" class="hint">
                Cheats remain hidden in production environments.
            </span>
        </div>
    </label>
</section>

<style>
    .qa-cheats {
        border: 1px solid #6ee7b7;
        border-radius: 12px;
        padding: 1.25rem;
        display: grid;
        gap: 0.75rem;
        max-width: 640px;
        background: linear-gradient(135deg, #102019, #0a140f);
        color: #e8f5e9;
        box-shadow: 0 10px 32px rgba(0, 0, 0, 0.25);
    }

    .heading {
        display: grid;
        gap: 0.35rem;
    }

    h2 {
        margin: 0;
        font-size: 1.2rem;
        color: #f0fff4;
    }

    p {
        margin: 0;
        line-height: 1.5;
    }

    .toggle {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.75rem;
        align-items: center;
        padding: 0.75rem 0.9rem;
        border: 1px dashed #6ee7b7;
        border-radius: 10px;
        background: rgba(110, 231, 183, 0.08);
    }

    .toggle input[type='checkbox'] {
        appearance: none;
        width: 52px;
        height: 30px;
        border-radius: 999px;
        border: 2px solid #6ee7b7;
        background: rgba(110, 231, 183, 0.18);
        position: relative;
        cursor: pointer;
        transition:
            background-color 160ms ease,
            border-color 160ms ease;
    }

    .toggle input[type='checkbox']::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 4px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #e8f5e9;
        transition: transform 160ms ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }

    .toggle input[type='checkbox']:checked {
        background: #34d399;
        border-color: #34d399;
    }

    .toggle input[type='checkbox']:checked::after {
        transform: translateX(20px);
    }

    .toggle input[type='checkbox']:focus-visible {
        outline: 2px solid #fcd34d;
        outline-offset: 3px;
    }

    .toggle-copy {
        display: grid;
        gap: 0.2rem;
    }

    .label {
        font-weight: 700;
        color: #f0fff4;
    }

    .hint {
        color: #c7f7de;
        font-size: 0.9rem;
    }

    @media (max-width: 640px) {
        .qa-cheats {
            padding: 1rem;
        }
    }
</style>
