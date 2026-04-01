<script>
    import { onMount } from 'svelte';

    export let durationMs = 86_400_000;
    export let storageKey = 'longTaskCompletion';

    let targetTime = 0;
    let remainingMs = durationMs;
    let initialized = false;

    const readTarget = () => {
        if (typeof localStorage === 'undefined') return null;
        try {
            const stored = localStorage.getItem(storageKey);
            const parsed = stored ? Number(stored) : NaN;
            return Number.isFinite(parsed) ? parsed : null;
        } catch (error) {
            console.error('Failed to read task timestamp from localStorage:', error);
            return null;
        }
    };

    const persistTarget = (timestamp) => {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(storageKey, String(timestamp));
        } catch (error) {
            console.error('Failed to persist task timestamp to localStorage:', error);
        }
    };

    const updateRemaining = () => {
        if (!initialized) return;
        remainingMs = Math.max(targetTime - Date.now(), 0);
    };

    onMount(() => {
        const storedTarget = readTarget();
        const now = Date.now();

        targetTime = storedTarget && storedTarget > now ? storedTarget : now + durationMs;
        persistTarget(targetTime);
        initialized = true;
        updateRemaining();

        const interval = setInterval(updateRemaining, 1000);
        return () => {
            clearInterval(interval);
        };
    });

    $: remainingSeconds = Math.ceil(remainingMs / 1000);
    $: statusText = !initialized
        ? 'Preparing task...'
        : remainingSeconds > 0
          ? `Come back after ${remainingSeconds} seconds.`
          : 'Done.';
</script>

<p class="task-status">{statusText}</p>

<style>
    .task-status {
        color: var(--color-text);
        font-weight: 600;
        margin: 0.25rem 0 0;
    }
</style>
