<script>
    import hardeningUtils from '../../utils/hardening';

    const { emojiForHardening, hardeningStatusText } = hardeningUtils;

    export let hardening;
</script>

{#if hardening}
    <div class="hardening-badge" data-testid="hardening-badge">
        <span class="emoji" aria-hidden="true">{emojiForHardening(hardening)}</span>
        <div class="text">
            <span class="label">{hardeningStatusText(hardening)}</span>
            <span class="score">Score: {hardening.score}/100</span>
        </div>
    </div>
{/if}

<style>
    .hardening-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-radius: 12px;
        background: #1f4122;
        color: #e8ffe8;
        border: 1px solid #4ba758;
        font-size: 0.9rem;
    }

    .emoji {
        font-size: 1.3rem;
    }

    .text {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
    }

    .label {
        font-weight: 600;
    }

    .score {
        font-size: 0.8rem;
        color: #c6e8c6;
    }
</style>
