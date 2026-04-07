<script>
    export let quest,
        compact = false,
        status = 'unknown';

    let imageLoaded = false;

    $: statusLabel =
        status === 'completed'
            ? 'Completed'
            : status === 'available'
              ? 'Start'
              : status === 'locked'
                ? 'Locked'
                : 'Checking';
</script>

<div class="container" class:quest data-testid="quest-tile" data-status={status}>
    {#if quest}
        {#if compact}
            <div class="content compact-content">
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
                    <div class="status-slot" data-testid="quest-status-slot">{statusLabel}</div>
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
                    <div class="status-slot" data-testid="quest-status-slot">{statusLabel}</div>
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
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        border-radius: 20px 20px 0 0;
        background: #151526;
        box-sizing: border-box;
        overflow: hidden;
        flex: 0 0 auto;
    }

    .quest-img-shell.compact-shell {
        width: 100px;
        min-height: 100px;
        border-radius: 20px 0 0 20px;
        flex-basis: 100px;
    }
    .quest-img {
        width: 100%;
        height: 100%;
        min-height: 200px;
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
        min-height: 100px;
        object-fit: cover;
    }

    .content {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        height: 100%;
        gap: 0;
        min-width: 0;
    }

    .compact-content {
        flex-direction: row;
    }

    .content-text {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 18px 20px 16px;
    }

    .status-slot {
        min-height: 24px;
        width: 100%;
        padding-top: 8px;
        font-weight: 600;
        opacity: 0.9;
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
</style>
