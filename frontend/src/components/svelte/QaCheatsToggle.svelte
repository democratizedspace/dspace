<script>
    import { onDestroy, onMount } from 'svelte';
    import {
        hydrateQaCheatsPreference,
        qaCheatsAvailability,
        qaCheatsPreference,
        updateQaCheatsEnabled,
    } from '../../stores/qaCheats.js';

    export let cheatsAvailable = false;

    let isAvailable = false;
    let preferenceEnabled = false;
    let mounted = false;

    const unsubscribe = [];

    const onToggle = (event) => {
        const { checked } = event.target;
        updateQaCheatsEnabled(checked);
    };

    onMount(() => {
        hydrateQaCheatsPreference(cheatsAvailable);

        unsubscribe.push(
            qaCheatsAvailability.subscribe((value) => {
                isAvailable = value;
            }),
            qaCheatsPreference.subscribe((value) => {
                preferenceEnabled = value;
            })
        );

        mounted = true;
    });

    onDestroy(() => {
        unsubscribe.forEach((stop) => stop?.());
    });
</script>

{#if mounted && isAvailable}
    <section class="qa-cheats" data-testid="qa-cheats-section">
        <div class="heading">
            <h2>QA Cheats</h2>
            <p>
                Shows testing-only options like “Instant finish” for long-running processes. Enabled
                per device.
            </p>
        </div>

        <label class="toggle">
            <input
                type="checkbox"
                checked={preferenceEnabled && isAvailable}
                on:change={onToggle}
                data-testid="qa-cheats-toggle"
            />
            <span class="slider" aria-hidden="true"></span>
            <span class="label">Enable QA cheats</span>
        </label>
    </section>
{/if}

<style>
    .qa-cheats {
        border: 1px solid #d97706;
        border-radius: 12px;
        padding: 1.5rem;
        display: grid;
        gap: 0.75rem;
        max-width: 640px;
        background: linear-gradient(135deg, #45270c, #291707);
        color: #fef3c7;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
    }

    .heading {
        display: grid;
        gap: 0.25rem;
    }

    h2 {
        margin: 0;
        font-size: 1.2rem;
    }

    p {
        margin: 0;
    }

    .toggle {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        user-select: none;
        font-weight: 700;
        color: #fffbeb;
        width: fit-content;
    }

    input[type='checkbox'] {
        display: none;
    }

    .slider {
        position: relative;
        width: 52px;
        height: 28px;
        background: #b45309;
        border-radius: 999px;
        transition: background 150ms ease-in-out;
        box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.3);
    }

    .slider::after {
        content: '';
        position: absolute;
        width: 22px;
        height: 22px;
        background: #fff7ed;
        border-radius: 50%;
        top: 3px;
        left: 4px;
        transition: transform 150ms ease-in-out, background 150ms ease-in-out;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    }

    input[type='checkbox']:checked + .slider {
        background: #f59e0b;
    }

    input[type='checkbox']:checked + .slider::after {
        transform: translateX(22px);
        background: #fef3c7;
    }

    .label {
        font-size: 1rem;
    }
</style>
