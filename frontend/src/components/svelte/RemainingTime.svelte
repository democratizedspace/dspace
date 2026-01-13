<script>
    import { prettyPrintDuration } from '../../utils.js';

    export let endDate;
    export let totalDurationInSeconds;

    let timeRemaining = '0s';

    $: {
        const totalSeconds = Number(totalDurationInSeconds ?? 0);
        const endTimestamp = endDate instanceof Date ? endDate.getTime() : Number(endDate);
        let remainingSeconds = 0;

        if (Number.isFinite(endTimestamp) && endTimestamp > 0) {
            remainingSeconds = Math.max(0, Math.round((endTimestamp - Date.now()) / 1000));
        } else if (Number.isFinite(totalSeconds) && totalSeconds > 0) {
            remainingSeconds = totalSeconds;
        }

        timeRemaining = prettyPrintDuration(remainingSeconds, false);
    }
</script>

<p>{timeRemaining} remaining</p>

<style>
    p {
        margin: 0;
    }
</style>
