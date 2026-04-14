<script>
    export let quest,
        compact = false,
        status = 'unknown';

    let imageLoaded = false;

    $: statusLabel = status === 'completed' ? 'Completed' : '';

    $: assistiveStatusLabel =
        status === 'available'
            ? 'Available'
            : status === 'completed'
              ? 'Completed'
              : 'Checking';
</script>

<div class="container" class:quest data-testid="quest-tile" data-status={status}>
    {#if quest}
        {#if compact}
            <div class="content" class:compact-content={compact}>
                <div class="quest-img-shell" class:compact-shell={compact}>
                    <img
                        class="quest-img quest-img-compact"
                        class:loaded={imageLoaded}
                        src={quest.image}
                        alt={`Quest artwork for ${quest.title}`}
                        loading="lazy"
                        decoding="async"
                        width="100"
                        height="100"
                        on:load={() => {
                            imageLoaded = true;
                        }}
                    />
                </div>
                <div class="content-text" data-testid="quest-tile-text">
                    <h3>{quest.title}</h3>
                    {#if statusLabel}
                        <div class="status-slot" data-testid="quest-status-slot">{statusLabel}</div>
                    {/if}
                    <span class="sr-only">Status: {assistiveStatusLabel}</span>
                </div>
            </div>
        {:else}
            <div class="content">
                <div class="quest-img-shell" class:compact-shell={compact}>
                    <img
                        class="quest-img"
                        class:loaded={imageLoaded}
                        src={quest.image}
                        alt={`Quest artwork for ${quest.title}`}
                        loading="lazy"
                        decoding="async"
                        width="200"
                        height="200"
                        on:load={() => {
                            imageLoaded = true;
                        }}
                    />
                </div>
                <div class="content-text" data-testid="quest-tile-text">
                    <h3>{quest.title}</h3>
                    <p>{quest.description}</p>
                    {#if statusLabel}
                        <div class="status-slot" data-testid="quest-status-slot">{statusLabel}</div>
                    {/if}
                    <span class="sr-only">Status: {assistiveStatusLabel}</span>
                </div>
            </div>
        {/if}
    {/if}
</div>

<style>
    .container {
        background-color: #68d46d;
        color: black;
        border-radius: 20px;
        margin: 5px;
        opacity: 0.8;
        max-width: 100%;
        height: calc(100% - 10px);
        overflow: hidden;
        box-sizing: border-box;
    }

    .container:hover,
    .container.quest {
        opacity: 1;
    }

    h3,
    p {
        margin: 0;
        padding: 10px;
    }

    .quest-img-shell {
        width: 100%;
        aspect-ratio: 1 / 1;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 20px 20px 0 0;
        background: #1d1d2e;
        border: 0;
        box-sizing: border-box;
        overflow: hidden;
        flex: 0 0 auto;
    }

    .quest-img-shell.compact-shell {
        width: 100px;
        min-height: 100px;
        aspect-ratio: 1 / 1;
        flex-basis: 100px;
        border-radius: 20px 0 0 20px;
    }
    .quest-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        box-sizing: border-box;
        opacity: 0;
        transition: opacity 120ms ease-in;
    }

    .quest-img.loaded {
        opacity: 1;
    }

    .quest-img-compact {
        flex: 0 1 auto;
        width: 100px;
        height: 100px;
        object-fit: contain;
    }

    .content {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        height: 100%;
        gap: 0;
        min-width: 0;
    }

    .content.compact-content {
        flex-direction: row;
    }

    .content-text {
        flex: 1 1 auto;
        min-width: 180px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 16px 20px;
    }

    .status-slot {
        min-height: 24px;
        width: 100%;
        padding-top: 8px;
        font-weight: 600;
        opacity: 0.9;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    @media only screen and (max-width: 640px) {
        .content-text {
            padding: 12px 16px;
        }
    }

    .content-text h3,
    .content-text p {
        width: 100%;
        min-width: 0;
        overflow-wrap: anywhere;
        padding: 0;
    }

    .content-text p {
        margin-top: 8px;
    }
</style>
