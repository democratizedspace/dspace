<script>
    import { createEventDispatcher } from 'svelte';
    import { prettyPrintDuration } from '../../utils.js';

    export let startDate = new Date();
    export let totalDurationSeconds = 5;
    export let stopped = false;
    export let renderTick = 0;

    const dispatch = createEventDispatcher();
    let elapsedSeconds = 0;
    let progressRatio = 0;
    let completed = false;

    $: normalizedStartDate =
        startDate instanceof Date ? startDate : new Date(startDate ?? Date.now());
    $: startTimestamp = Number.isFinite(normalizedStartDate?.getTime?.())
        ? normalizedStartDate.getTime()
        : Date.now();

    $: if (startTimestamp || totalDurationSeconds || totalDurationSeconds === 0) {
        completed = false;
    }

    $: if (renderTick || renderTick === 0) {
        const totalDurationSafe = Math.max(0, Number(totalDurationSeconds) || 0);
        const elapsedMillis = Math.max(0, Date.now() - startTimestamp);
        elapsedSeconds =
            totalDurationSafe > 0 ? Math.min(elapsedMillis / 1000, totalDurationSafe) : 0;
        progressRatio = totalDurationSafe > 0 ? elapsedSeconds / totalDurationSafe : 1;
        progressRatio = Math.min(1, Math.max(0, progressRatio));

        if (progressRatio >= 1 && !completed) {
            completed = true;
            dispatch('fillComplete');
        }
    }
</script>

<div class="progress-container">
    {#if stopped}
        stopped
        <div class="progress-bar">
            <div
                class="progress-bar-fill"
                style="width: {(progressRatio * 100).toFixed(2)}%; transition: none"
            ></div>
        </div>
    {:else}
        <div class="progress-bar">
            <div
                class="progress-bar-fill"
                style="width: {(progressRatio * 100).toFixed(2)}%; transition: width 0.1s linear"
            ></div>
        </div>
    {/if}
    <div class="progress-text">
        <p>
            Progress: {(progressRatio * 100).toFixed(2)}%
        </p>
        <p>
            Time Left: {prettyPrintDuration(totalDurationSeconds - elapsedSeconds)}
        </p>
    </div>
</div>

<style>
    .progress-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%; /* Or other fixed width if you wish */
    }

    .progress-bar {
        width: 100%;
        background-color: #f3f3f3;
        overflow: hidden;
        border-radius: 20px;
        margin: 5px;
    }

    .progress-bar-fill {
        height: 50px;
        background-color: #68d46d;
        transition: width 0.1s linear;
    }

    .progress-text {
        text-align: center;
    }
</style>
