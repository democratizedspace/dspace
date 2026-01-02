<script>
    import { onMount } from 'svelte';

    import { detectLegacyArtifacts } from '../../utils/legacySaveDetection';

    let hasLegacy = false;

    const refreshDetection = () => {
        const detection = detectLegacyArtifacts();
        hasLegacy = detection.hasV1Cookies || detection.hasV2LocalStorage;
    };

    const handleExternalRefresh = () => {
        refreshDetection();
    };

    onMount(() => {
        refreshDetection();
        if (typeof window !== 'undefined') {
            window.addEventListener('legacy-upgrade-refresh', handleExternalRefresh);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('legacy-upgrade-refresh', handleExternalRefresh);
            }
        };
    });
</script>

{#if hasLegacy}
    <div class="legacy-banner" role="status" aria-live="polite">
        <span>Legacy save detected — upgrade to v3 ASAP.</span>
        <a href="/settings" class="link">Open settings</a>
    </div>
{/if}

<style>
    .legacy-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        margin: 0.5rem 0 1rem;
        border-radius: 10px;
        background: linear-gradient(90deg, rgba(234, 88, 12, 0.18), rgba(234, 88, 12, 0.28));
        border: 1px solid rgba(234, 88, 12, 0.55);
        color: #f59e0b;
        font-weight: 600;
    }

    .link {
        color: #f8fafc;
        text-decoration: none;
        background: rgba(234, 88, 12, 0.2);
        border: 1px solid rgba(234, 88, 12, 0.6);
        padding: 0.35rem 0.6rem;
        border-radius: 8px;
        font-weight: 700;
    }

    .link:hover,
    .link:focus-visible {
        text-decoration: underline;
    }

    .link:focus-visible {
        outline: 2px solid rgba(248, 250, 252, 0.9);
        outline-offset: 2px;
    }
</style>
