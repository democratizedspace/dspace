<script>
    import { createEventDispatcher } from 'svelte';
    import { prettyPrintDuration } from '../../utils.js';

    export let startDate = new Date();
    export let totalDurationSeconds = 5;
    export let stopped = false;
    export let currentTime = Date.now();
    export let inverted = false;

    const dispatch = createEventDispatcher();
    let elapsedSeconds = 0;
    let progressRatio = 0;
    let completed = false;

    $: {
        const durationSeconds = Math.max(0, Number(totalDurationSeconds) || 0);
        const nowMs =
            typeof currentTime === 'number' ? currentTime : new Date(currentTime).getTime();
        const startTimeMs = startDate ? new Date(startDate).getTime() : nowMs;
        const safeStartTimeMs = Number.isFinite(startTimeMs) ? startTimeMs : nowMs;
        const elapsedMillis = Math.max(0, nowMs - safeStartTimeMs);
        elapsedSeconds = durationSeconds > 0 ? Math.min(elapsedMillis / 1000, durationSeconds) : 0;
        progressRatio = durationSeconds > 0 ? elapsedSeconds / durationSeconds : 1;
    }

    $: if (!completed && progressRatio >= 1) {
        completed = true;
        dispatch('fillComplete');
    }

    $: if (progressRatio < 1) {
        completed = false;
    }
</script>

<div class="progress-container" class:inverted>
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
        border: 1px solid rgba(17, 24, 39, 0.12);
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
        color: #ffffff;
    }

    .progress-container.inverted .progress-bar {
        background-color: #d1d5db;
    }

    .progress-container.inverted .progress-bar-fill {
        background-color: #007006;
    }

    .progress-container.inverted .progress-text {
        color: #111827;
    }
</style>
