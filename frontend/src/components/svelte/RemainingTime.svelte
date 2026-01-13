<script>
    import { prettyPrintDuration } from '../../utils.js';

    export let endDate;
    export let totalDurationInSeconds;
    export let renderTick = 0;

    let timeRemaining;

    $: if (renderTick || renderTick === 0) {
        const normalizedEndDate = endDate instanceof Date ? endDate : new Date(endDate);
        const endTimestamp = Number.isFinite(normalizedEndDate?.getTime?.())
            ? normalizedEndDate.getTime()
            : Date.now();
        const timeDiffInSeconds = Math.round((endTimestamp - Date.now()) / 1000);
        if (timeDiffInSeconds > 0) {
            timeRemaining = prettyPrintDuration(timeDiffInSeconds, false);
        } else if (totalDurationInSeconds > 0) {
            timeRemaining = prettyPrintDuration(totalDurationInSeconds, false);
        } else {
            timeRemaining = '0s';
        }
    }
</script>

<p>{timeRemaining} remaining</p>

<style>
    p {
        margin: 0;
    }
</style>
