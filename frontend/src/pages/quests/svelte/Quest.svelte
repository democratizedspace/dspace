<script>
    import { QUEST_LIST_STATUSES } from './questListClassifier.js';

    export let quest,
        compact = false,
        status = QUEST_LIST_STATUSES.UNKNOWN;

    let imageLoaded = false;

    const statusLabel = {
        [QUEST_LIST_STATUSES.UNKNOWN]: 'Status syncing',
        [QUEST_LIST_STATUSES.LOCKED]: 'Locked',
        [QUEST_LIST_STATUSES.AVAILABLE]: 'Start',
        [QUEST_LIST_STATUSES.IN_PROGRESS]: 'Continue',
        [QUEST_LIST_STATUSES.COMPLETED]: 'Completed',
    };
</script>

<div class="container" class:quest data-testid="quest-tile" data-status={status}>
    {#if quest}
        {#if compact}
            <div class="content">
                <div class="image-box compact-box">
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
                </div>
            </div>
        {:else}
            <div class="content">
                <div class="image-box">
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
                    <div class="status-slot" aria-live="polite">
                        <span class="status-pill">{statusLabel[status]}</span>
                    </div>
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

    .image-box {
        flex: 0 0 200px;
        width: 200px;
        height: 200px;
        margin: 0;
        border-radius: 20px;
        background: #1d1d2e;
        border: 5px solid #68d46d;
        box-sizing: border-box;
        overflow: hidden;
    }

    .compact-box {
        flex: 0 1 auto;
        width: 100px;
        height: 100px;
    }

    .quest-img {
        width: 100%;
        height: 100%;
        border-radius: 20px;
        object-fit: contain;
        object-position: center;
        opacity: 0;
        transition: opacity 160ms ease-in;
    }

    .quest-img.loaded {
        opacity: 1;
    }

    .quest-img-compact {
        width: 100px;
        height: 100px;
    }

    .content {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        height: 100%;
        gap: 0;
        min-width: 0;
    }

    @media only screen and (max-width: 640px) {
        .content {
            flex-direction: column;
        }

        .image-box {
            width: calc(100% - 20px);
            height: 200px;
            margin: 0 10px;
        }
    }

    .content-text {
        flex: 1 1 auto;
        min-width: 180px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        padding: 16px 24px;
    }

    .status-slot {
        min-height: 28px;
        display: flex;
        align-items: center;
        margin-top: 12px;
    }

    .status-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 110px;
        height: 28px;
        border-radius: 999px;
        background: rgba(29, 29, 46, 0.22);
        padding: 0 12px;
        font-size: 0.82rem;
        font-weight: 600;
        transition:
            opacity 160ms ease-in,
            background-color 160ms ease-in;
    }

    [data-status='unknown'] .status-pill {
        opacity: 0.75;
    }

    [data-status='available'] .status-pill,
    [data-status='in-progress'] .status-pill {
        background: rgba(29, 29, 46, 0.4);
        color: #fff;
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
