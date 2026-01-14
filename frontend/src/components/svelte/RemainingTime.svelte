<script>
    import { prettyPrintDuration } from '../../utils.js';

    export let endDate;
    export let currentTime = Date.now();

    let timeRemaining;

    $: {
        const endTime = typeof endDate === 'number' ? endDate : new Date(endDate ?? 0).getTime();
        const nowMs =
            typeof currentTime === 'number' ? currentTime : new Date(currentTime).getTime();
        const safeEndTime = Number.isFinite(endTime) ? endTime : nowMs;
        const remainingSeconds = Math.max(0, Math.round((safeEndTime - nowMs) / 1000));
        timeRemaining = prettyPrintDuration(remainingSeconds, false);
    }
</script>

<p>{timeRemaining} remaining</p>

<style>
    p {
        margin: 0;
    }
</style>
