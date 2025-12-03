<script>
    import { onMount } from 'svelte';
    import { resolveInitialTheme, setTheme } from '../../lib/theme';

    /** @type {'light' | 'dark'} */
    let theme = 'dark';
    let isReady = false;

    onMount(() => {
        const initialTheme = resolveInitialTheme();
        theme = initialTheme;
        isReady = true;
    });

    const toggleTheme = () => {
        if (!isReady) return;

        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        theme = setTheme(nextTheme);
    };
</script>

<button
    type="button"
    class="theme-toggle"
    aria-label="Toggle dark mode"
    aria-pressed={theme === 'dark'}
    on:click={toggleTheme}
    disabled={!isReady}
    data-hydrated={isReady ? 'true' : 'false'}
>
    <span class="theme-toggle__icon" aria-hidden="true">
        {theme === 'dark' ? '🌙' : '☀️'}
    </span>
    <span class="theme-toggle__text">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
</button>

<style>
    .theme-toggle {
        align-items: center;
        background-color: transparent;
        border: 1px solid var(--color-border);
        border-radius: 999px;
        color: var(--color-text);
        cursor: pointer;
        display: inline-flex;
        font: inherit;
        gap: 0.5rem;
        padding: 0.35rem 0.85rem;
        transition: background-color 120ms ease-in-out, opacity 120ms ease-in-out;
    }

    .theme-toggle:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 2px;
    }

    .theme-toggle:hover:not(:disabled) {
        background-color: rgba(255, 255, 255, 0.12);
    }

    :global(html[data-theme='light']) .theme-toggle:hover:not(:disabled) {
        background-color: rgba(0, 0, 0, 0.08);
    }

    .theme-toggle:disabled {
        cursor: wait;
        opacity: 0.6;
    }

    .theme-toggle__icon {
        font-size: 1rem;
    }

    .theme-toggle__text {
        font-size: 0.85rem;
        font-weight: 600;
        white-space: nowrap;
    }
</style>
