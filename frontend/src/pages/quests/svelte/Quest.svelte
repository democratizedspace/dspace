<script>
    import { QUEST_STATUS } from '../questListClassifier.js';

    export let quest,
        compact = false;

    let imageLoaded = false;

    const statusLabelByType = {
        [QUEST_STATUS.UNKNOWN]: 'Status pending',
        [QUEST_STATUS.LOCKED]: 'Locked',
        [QUEST_STATUS.AVAILABLE]: 'Available',
        [QUEST_STATUS.COMPLETED]: 'Completed',
    };

    $: questStatus = statusLabelByType[quest?.status] ?? statusLabelByType[QUEST_STATUS.UNKNOWN];
</script>

<div
    class="container"
    class:quest
    data-testid="quest-tile"
    data-status={quest?.status ?? 'unknown'}
>
    {#if quest}
        {#if compact}
            <div class="content">
                <div class="image-shell image-shell-compact" data-loaded={imageLoaded}>
                    <img
                        class="quest-img quest-img-compact"
                        src={quest.image}
                        alt={`Quest artwork for ${quest.title}`}
                        width="100"
                        height="100"
                        loading="lazy"
                        decoding="async"
                        on:load={() => {
                            imageLoaded = true;
                        }}
                    />
                </div>
                <div class="content-text" data-testid="quest-tile-text">
                    <h3>{quest.title}</h3>
                    <div class="status-slot" data-testid="quest-status">{questStatus}</div>
                </div>
            </div>
        {:else}
            <div class="content">
                <div class="image-shell" data-loaded={imageLoaded}>
                    <img
                        class="quest-img"
                        src={quest.image}
                        alt={`Quest artwork for ${quest.title}`}
                        width="200"
                        height="200"
                        loading="lazy"
                        decoding="async"
                        on:load={() => {
                            imageLoaded = true;
                        }}
                    />
                </div>
                <div class="content-text" data-testid="quest-tile-text">
                    <h3>{quest.title}</h3>
                    <p>{quest.description}</p>
                    <div class="status-slot" data-testid="quest-status">{questStatus}</div>
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

    .image-shell {
        flex: 0 0 200px;
        width: 200px;
        height: 200px;
        border-radius: 20px;
        margin: -10px;
        background: #1d1d2e;
        border: 5px solid #68d46d;
        box-sizing: border-box;
        overflow: hidden;
    }

    .image-shell-compact {
        flex: 0 0 100px;
        width: 100px;
        height: 100px;
    }

    .quest-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        opacity: 0;
        transition: opacity 180ms ease-in;
    }

    .image-shell[data-loaded='true'] .quest-img {
        opacity: 1;
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

        .image-shell {
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

    .status-slot {
        min-height: 1.5rem;
        line-height: 1.5rem;
        font-weight: 600;
        margin-top: 0.5rem;
        opacity: 0.9;
    }
</style>
