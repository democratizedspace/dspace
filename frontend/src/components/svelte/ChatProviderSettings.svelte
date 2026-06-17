<script>
    import { onDestroy, onMount } from 'svelte';
    import OpenAIAPIKeySettings from './OpenAIAPIKeySettings.svelte';
    import {
        loadGameState,
        ready,
        saveGameState,
        state as gameStateStore,
    } from '../../utils/gameState/common.js';
    import { normalizeSettings } from '../../utils/settingsDefaults.js';

    const CHAT_PROVIDER_OPTIONS = ['token-place', 'openai'];

    let hydrated = false;
    let loading = true;
    let chatProvider = 'token-place';
    let status = 'token.place is selected by default.';
    let unsubscribe;

    const syncFromState = (value) => {
        chatProvider = normalizeSettings(value?.settings).chatProvider;
    };

    onMount(async () => {
        await ready;
        const current = loadGameState();
        syncFromState(current);
        status =
            chatProvider === 'openai'
                ? 'OpenAI is selected for Chat.'
                : 'token.place is selected for Chat.';
        unsubscribe = gameStateStore.subscribe((value) => syncFromState(value));
        hydrated = true;
        loading = false;
    });

    onDestroy(() => {
        unsubscribe?.();
    });

    const persistProvider = async (nextProvider) => {
        if (!CHAT_PROVIDER_OPTIONS.includes(nextProvider) || nextProvider === chatProvider) {
            return;
        }

        chatProvider = nextProvider;
        loading = true;
        status = 'Saving Chat provider…';

        await ready;
        const current = loadGameState();
        const settings = normalizeSettings(current.settings);

        await saveGameState({
            ...current,
            settings: {
                ...settings,
                chatProvider: nextProvider,
            },
        });

        status =
            nextProvider === 'openai'
                ? 'OpenAI selected. Add your OpenAI API key below to use it in Chat.'
                : 'token.place selected. No API key or credential is required.';
        loading = false;
    };
</script>

<section class="panel chat-provider-settings" data-hydrated={hydrated ? 'true' : 'false'}>
    <div class="heading">
        <h2>Chat provider</h2>
        <p>
            Choose the provider used by the DSPACE Chat NPCs. token.place is the default and works
            without authentication or an API key.
        </p>
    </div>

    <fieldset disabled={loading} aria-describedby="chat-provider-help chat-provider-status">
        <legend>Provider</legend>
        <label class="provider-option">
            <input
                type="radio"
                name="chat-provider"
                value="token-place"
                checked={chatProvider === 'token-place'}
                on:change={() => persistProvider('token-place')}
                data-testid="chat-provider-token-place"
            />
            <span>
                <strong>token.place</strong>
                <small
                    >Default Chat provider. No auth, no OpenAI key, and no credential field.</small
                >
            </span>
        </label>
        <label class="provider-option">
            <input
                type="radio"
                name="chat-provider"
                value="openai"
                checked={chatProvider === 'openai'}
                on:change={() => persistProvider('openai')}
                data-testid="chat-provider-openai"
            />
            <span>
                <strong>OpenAI</strong>
                <small>Use your own OpenAI API key stored locally in this browser.</small>
            </span>
        </label>
    </fieldset>

    <p id="chat-provider-help" class="help-text">
        DSPACE does not ask for or store a token.place API key. OpenAI keys stay in the existing
        local OpenAI settings slot for backwards compatibility.
    </p>
    <p id="chat-provider-status" class="status" role="status" data-testid="chat-provider-status">
        {status}
    </p>

    {#if hydrated && chatProvider === 'openai'}
        <div class="openai-key-panel" data-testid="openai-key-panel">
            <OpenAIAPIKeySettings reloadOnSave={false} />
        </div>
    {/if}
</section>

<style>
    .panel {
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 1.25rem;
        display: grid;
        gap: 0.85rem;
        max-width: 640px;
        background: linear-gradient(135deg, #0b1221, #0d1828);
        color: #e2e8f0;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
    }

    .heading {
        display: grid;
        gap: 0.35rem;
    }

    h2,
    p {
        margin: 0;
    }

    fieldset {
        border: 1px solid #475569;
        border-radius: 10px;
        display: grid;
        gap: 0.75rem;
        margin: 0;
        padding: 1rem;
    }

    legend {
        padding: 0 0.35rem;
        font-weight: 700;
    }

    .provider-option {
        align-items: flex-start;
        cursor: pointer;
        display: grid;
        gap: 0.65rem;
        grid-template-columns: auto 1fr;
    }

    .provider-option input {
        margin-top: 0.2rem;
    }

    .provider-option span {
        display: grid;
        gap: 0.2rem;
    }

    small,
    .help-text {
        color: #cbd5e1;
    }

    .status {
        color: #93c5fd;
        font-weight: 700;
    }

    .openai-key-panel {
        border-top: 1px solid #334155;
        padding-top: 0.85rem;
    }
</style>
