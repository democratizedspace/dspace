<script>
    import { onMount } from 'svelte';
    import { ready, state } from '../../utils/gameState/common.js';
    import { evaluateTitles } from '../../utils/titles.js';
    import { isBrowser } from '../../utils/ssr.js';
    import Chip from '../../components/svelte/Chip.svelte';

    let hydrated = false;
    let titles = [];
    let selectedTitleId = isBrowser ? localStorage.getItem('selectedTitle') : null;

    onMount(async () => {
        await ready;
        hydrated = true;
    });

    $: if (hydrated) {
        titles = evaluateTitles($state);
    }

    function selectTitle(title) {
        if (!title.unlocked) return;
        selectedTitleId = title.id;
        if (isBrowser) {
            localStorage.setItem('selectedTitle', title.id);
        }
    }
</script>

<section class="profile-titles" data-hydrated={hydrated ? 'true' : 'false'}>
    <p class="summary">Select a title to display. Earn achievements to unlock more titles.</p>

    {#if hydrated}
        <div class="list">
            {#each titles as title}
                <div
                    class="item"
                    data-unlocked={title.unlocked ? 'true' : 'false'}
                    data-selected={selectedTitleId === title.id ? 'true' : 'false'}
                    role={title.unlocked ? 'button' : undefined}
                    tabindex={title.unlocked ? 0 : undefined}
                    on:click={() => title.unlocked && selectTitle(title)}
                    on:keydown={(e) => {
                        if (title.unlocked && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            selectTitle(title);
                        }
                    }}
                >
                    <Chip
                        text={title.name}
                        disabled={!title.unlocked}
                        inverted={title.unlocked}
                        pressed={selectedTitleId === title.id}
                    />
                    <span
                        class={`status ${title.unlocked ? 'unlocked' : 'locked'}`}
                        aria-hidden="true"
                    >
                        {#if selectedTitleId === title.id}
                            Selected
                        {:else if title.unlocked}
                            Unlocked
                        {:else}
                            Locked
                        {/if}
                    </span>
                    <p class="description">{title.description}</p>
                </div>
            {/each}
        </div>
    {:else}
        <p class="loading" role="status">Loading titles…</p>
    {/if}
</section>

<style>
    .profile-titles {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .summary {
        margin: 0;
        color: #cdd8ff;
        line-height: 1.4;
    }

    .list {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
    }

    .item {
        padding: 0.9rem 1rem;
        border-radius: 14px;
        background: rgba(37, 61, 37, 0.45);
        border: 1px solid rgba(120, 150, 255, 0.2);
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.35rem 0.75rem;
        align-items: center;
        transition: all 0.2s ease;
    }

    .item[data-selected='true'] {
        background: color-mix(in srgb, var(--color-surface) 90%, var(--color-pill-active) 30%);
        border: 1px solid color-mix(in srgb, var(--color-pill-active) 50%, transparent);
        box-shadow: 0 0 12px color-mix(in srgb, var(--color-pill-active) 30%, transparent);
    }

    .item[data-unlocked='true']:not([data-selected='true']):hover {
        background: color-mix(in srgb, var(--color-surface) 65%, transparent);
        cursor: pointer;
    }

    .item[data-unlocked='true']:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--color-pill-active) 80%, transparent);
        outline-offset: 2px;
    }

    .status {
        color: #cdd8ff;
        font-size: 0.95rem;
        justify-self: start;
    }

    .status.locked {
        opacity: 0.65;
    }

    .description {
        margin: 0;
        color: #c9d3ff;
        line-height: 1.45;
        grid-column: 1 / -1;
    }

    .loading {
        margin: 0;
        color: #cdd8ff;
    }

    .loading {
        font-style: italic;
    }
</style>
