<script>
    import { createEventDispatcher } from 'svelte';
    import { prettyPrintDuration } from '../../utils.js';

    export let startDate = new Date();
    export let totalDurationSeconds = 5;
    export let stopped = false;
    export let now;

    let elapsedSeconds = 0;
    let progressRatio = 0;
    let durationSeconds = 0;
    let resolvedStartDate;
    let completed = false;

    const dispatch = createEventDispatcher();

    const resolveStartDate = (value) => {
        if (value instanceof Date) {
            return value;
        }
        if (typeof value === 'string' || typeof value === 'number') {
            return new Date(value);
        }
        return new Date();
    };

    $: resolvedStartDate = resolveStartDate(startDate);
    $: durationSeconds = Math.max(0, Number(totalDurationSeconds) || 0);
    $: {
        const currentTime = typeof now === 'number' ? now : Date.now();
        const elapsedMillis = currentTime - resolvedStartDate.getTime();
        const elapsedClamped = Math.min(Math.max(elapsedMillis / 1000, 0), durationSeconds);
        elapsedSeconds = durationSeconds > 0 ? elapsedClamped : 0;
        progressRatio = durationSeconds > 0 ? elapsedSeconds / durationSeconds : 1;
    }

    $: if (progressRatio < 1) {
        completed = false;
    }

    $: if (progressRatio >= 1 && !completed) {
        completed = true;
        dispatch('fillComplete');
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
                Time Left: {prettyPrintDuration(Math.max(0, durationSeconds - elapsedSeconds))}
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
