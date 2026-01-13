<script>
    import { prettyPrintDuration } from '../../utils.js';

    export let endDate;
    export let totalDurationInSeconds;
    export let now;

    let timeRemaining;
    let endTimestamp;

    const resolveEndDate = (value) => {
        if (value instanceof Date) {
            return value.getTime();
        }
        if (typeof value === 'string' || typeof value === 'number') {
            return new Date(value).getTime();
        }
        return undefined;
    };

    $: endTimestamp = resolveEndDate(endDate);
    $: {
        const totalSeconds = Math.max(0, Number(totalDurationInSeconds) || 0);
        const currentTime = typeof now === 'number' ? now : Date.now();
        const timeDiffInSeconds =
            typeof endTimestamp === 'number'
                ? Math.round((endTimestamp - currentTime) / 1000)
                : 0;
        if (timeDiffInSeconds > 0) {
            timeRemaining = prettyPrintDuration(timeDiffInSeconds, false);
        } else if (totalSeconds > 0) {
            timeRemaining = prettyPrintDuration(totalSeconds, false);
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
