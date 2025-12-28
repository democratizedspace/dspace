<script>
    import { onMount } from 'svelte';
    import {
        initializeQaCheats,
        qaCheatsAvailability,
        qaCheatsEnabled,
        setQaCheatsPreference,
    } from '../../lib/qaCheats';

    export let cheatsAvailable = false;

    let available = cheatsAvailable;
    let enabled = false;
    let hydrated = false;

    let unsubscribeAvailability;
    let unsubscribeEnabled;

    const handleToggle = () => {
        setQaCheatsPreference(!enabled);
    };

    onMount(() => {
        initializeQaCheats(cheatsAvailable);

        unsubscribeAvailability = qaCheatsAvailability.subscribe((value) => {
            available = value;
        });
        unsubscribeEnabled = qaCheatsEnabled.subscribe((value) => {
            enabled = value;
        });

        hydrated = true;

        return () => {
            unsubscribeAvailability?.();
            unsubscribeEnabled?.();
        };
    });
</script>

{#if available}
    <section class="qa-cheats" data-hydrated={hydrated ? 'true' : 'false'}>
        <div class="heading">
            <h2>QA Cheats</h2>
            <p>
                Shows testing-only options like “Instant finish” for long-running processes. Settings
                are stored on this device.
            </p>
        </div>

        <label class="cheat-toggle">
            <div class="cheat-toggle__label">
                <span class="title">Enable QA cheats</span>
                <span class="hint">Available only in dev and staging builds.</span>
            </div>
            <button
                type="button"
                class:enabled={enabled}
                class="cheat-toggle__control"
                aria-pressed={enabled}
                on:click={handleToggle}
                data-testid="qa-cheats-toggle"
            >
                <span aria-hidden="true" class="cheat-toggle__thumb"></span>
                <span class="cheat-toggle__state">{enabled ? 'On' : 'Off'}</span>
            </button>
        </label>
    </section>
{/if}

<style>
    .qa-cheats {
        border: 1px solid #0ea5e9;
        border-radius: 12px;
        padding: 1.25rem;
        display: grid;
        gap: 0.75rem;
        max-width: 640px;
        background: linear-gradient(135deg, #0b1f2e, #07131d);
        color: #e0f2ff;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
    }

    .heading {
        display: grid;
        gap: 0.35rem;
    }

    h2 {
        margin: 0;
        color: #e0f2ff;
    }

    p {
        margin: 0;
        color: #c3dafe;
    }

    .cheat-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        border: 1px solid rgba(14, 165, 233, 0.4);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        background: rgba(14, 165, 233, 0.08);
    }

    .cheat-toggle__label {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    .title {
        font-weight: 700;
        color: #e0f2ff;
    }

    .hint {
        font-size: 0.9rem;
        color: #93c5fd;
    }

    .cheat-toggle__control {
        position: relative;
        width: 86px;
        border-radius: 999px;
        border: 2px solid #38bdf8;
        background: linear-gradient(90deg, rgba(14, 165, 233, 0.2), rgba(8, 47, 73, 0.6));
        color: #e0f2ff;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.75rem;
        cursor: pointer;
        transition:
            background-color 120ms ease-in-out,
            border-color 120ms ease-in-out,
            transform 120ms ease-in-out;
    }

    .cheat-toggle__control:focus-visible {
        outline: 2px solid #38bdf8;
        outline-offset: 2px;
    }

    .cheat-toggle__control:hover {
        transform: translateY(-1px);
    }

    .cheat-toggle__control.enabled {
        background: linear-gradient(90deg, rgba(56, 189, 248, 0.4), rgba(14, 165, 233, 0.25));
        border-color: #a855f7;
        box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.4), 0 8px 16px rgba(0, 0, 0, 0.35);
    }

    .cheat-toggle__thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #38bdf8;
        box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.35);
    }

    .cheat-toggle__control.enabled .cheat-toggle__thumb {
        background: #a855f7;
        box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.35);
    }

    .cheat-toggle__state {
        font-weight: 700;
        letter-spacing: 0.02em;
    }
</style>
