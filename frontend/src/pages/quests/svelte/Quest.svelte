<script>
    import { QUEST_LIST_STATUS } from '../../../utils/quests/listClassifier.js';

    export let quest,
        compact = false,
        status = QUEST_LIST_STATUS.UNKNOWN;

    let imageLoaded = false;

    const statusLabelByType = {
        [QUEST_LIST_STATUS.UNKNOWN]: 'Status unavailable',
        [QUEST_LIST_STATUS.LOCKED]: 'Locked',
        [QUEST_LIST_STATUS.AVAILABLE]: 'Ready to start',
        [QUEST_LIST_STATUS.COMPLETED]: 'Completed',
    };
</script>

<div class="container" class:quest data-testid="quest-tile">
    {#if quest}
        {#if compact}
            <div class="content">
                <img
                    class="quest-img quest-img-compact"
                    class:loaded={imageLoaded}
                    src={quest.image}
                    alt={`Quest artwork for ${quest.title}`}
                    loading="lazy"
                    decoding="async"
                    on:load={() => {
                        imageLoaded = true;
                    }}
                />
                <div class="content-text" data-testid="quest-tile-text">
                    <h3>{quest.title}</h3>
                </div>
            </div>
        {:else}
            <div class="content">
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
                <div class="content-text" data-testid="quest-tile-text">
                    <h3>{quest.title}</h3>
                    <p>{quest.description}</p>
                    <p class="quest-status" data-testid="quest-status">{statusLabelByType[status]}</p>
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

    .quest-img {
        flex: 0 0 200px;
        width: 200px;
        height: 200px;
        border-radius: 20px;
        margin: -10px;
        object-fit: contain;
        object-position: center;
        background: #1d1d2e;
        border: 5px solid #68d46d;
        box-sizing: border-box;
        opacity: 0;
        transition: opacity 0.18s ease-in;
    }

    .quest-img.loaded {
        opacity: 1;
    }

    .quest-img-compact {
        flex: 0 1 auto;
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

        .quest-img {
            width: calc(100% - 20px);
            height: auto;
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

    .quest-status {
        min-height: 1.5rem;
        font-weight: 600;
        opacity: 0.9;
        transition: opacity 0.18s ease-in;
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
