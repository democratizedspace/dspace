<script>
    import { onDestroy, onMount } from 'svelte';
    import OpenAIAPIKeySettings from './OpenAIAPIKeySettings.svelte';
    import {
        loadGameState,
        ready,
        saveGameState,
        state as gameStateStore,
    } from '../../utils/gameState/common.js';
    import { DEFAULT_CHAT_PROVIDER, normalizeSettings } from '../../utils/settingsDefaults.js';

    const PROVIDERS = {
        tokenPlace: 'token-place',
        openAI: 'openai',
    };

    let hydrated = false;
    let selectedProvider = DEFAULT_CHAT_PROVIDER;
    let tokenPlaceTokenLite = false;
    let statusMessage = '';
    let unsubscribe;

    const syncFromState = (value) => {
        const settings = normalizeSettings(value?.settings);
        selectedProvider = settings.chatProvider;
        tokenPlaceTokenLite = settings.tokenPlaceTokenLite;
    };

    onMount(async () => {
        await ready;
        syncFromState(loadGameState());
        unsubscribe = gameStateStore.subscribe((value) => syncFromState(value));
        hydrated = true;
    });

    onDestroy(() => {
        unsubscribe?.();
    });

    async function persistTokenLite(enabled) {
        tokenPlaceTokenLite = enabled;
        await ready;
        const current = loadGameState();
        const nextSettings = {
            ...normalizeSettings(current.settings),
            chatProvider: selectedProvider,
            tokenPlaceTokenLite: enabled,
        };
        await saveGameState({
            ...current,
            settings: nextSettings,
        });
        statusMessage = enabled
            ? 'Token-lite mode enabled for token.place Chat.'
            : 'Token-lite mode disabled for token.place Chat.';
    }

    async function persistProvider(provider) {
        selectedProvider = provider;
        await ready;
        const current = loadGameState();
        const nextSettings = {
            ...normalizeSettings(current.settings),
            chatProvider: provider,
        };
        await saveGameState({
            ...current,
            settings: nextSettings,
        });
        statusMessage =
            provider === PROVIDERS.openAI
                ? 'Chat provider saved: OpenAI.'
                : 'Chat provider saved: token.place.';
    }
</script>

<section
    class="panel chat-provider-settings"
    data-hydrated={hydrated ? 'true' : 'false'}
    data-testid="chat-provider-settings"
>
    <div class="heading">
        <h2>Chat provider</h2>
        <p>
            token.place is the default DSPACE Chat provider. It needs no authentication, no API key,
            and no user-facing credential setup.
        </p>
    </div>

    {#if hydrated}
        <fieldset>
            <legend>Choose a Chat provider</legend>
            <label class="provider-option">
                <input
                    type="radio"
                    name="chat-provider"
                    value={PROVIDERS.tokenPlace}
                    checked={selectedProvider === PROVIDERS.tokenPlace}
                    on:change={() => persistProvider(PROVIDERS.tokenPlace)}
                />
                <span>
                    <strong>token.place</strong>
                    <small>Default provider. No API key required.</small>
                </span>
            </label>
            <label class="provider-option">
                <input
                    type="radio"
                    name="chat-provider"
                    value={PROVIDERS.openAI}
                    checked={selectedProvider === PROVIDERS.openAI}
                    on:change={() => persistProvider(PROVIDERS.openAI)}
                />
                <span>
                    <strong>OpenAI</strong>
                    <small>Use your own OpenAI API key stored locally in DSPACE.</small>
                </span>
            </label>
        </fieldset>

        {#if statusMessage}
            <p class="status" role="status">{statusMessage}</p>
        {/if}

        {#if selectedProvider === PROVIDERS.openAI}
            <div class="openai-panel">
                <h3>OpenAI API key</h3>
                <OpenAIAPIKeySettings />
            </div>
        {:else}
            <div class="token-place-panel">
                <p class="token-place-note" data-testid="token-place-no-key-note">
                    token.place Chat is ready to use. There is no token.place credential field on
                    this device.
                </p>
                <label class="token-lite-option">
                    <input
                        type="checkbox"
                        checked={tokenPlaceTokenLite}
                        data-testid="token-place-token-lite-toggle"
                        on:change={(event) => persistTokenLite(event.currentTarget.checked)}
                    />
                    <span>
                        <strong>Token-lite mode for token.place Chat</strong>
                        <small>
                            Debug mode: sends only a tiny system prompt plus your latest message.
                            Skips RAG, player state, and chat history.
                        </small>
                    </span>
                </label>
                <p class="token-lite-status" data-testid="token-place-token-lite-status">
                    Token-lite mode is {tokenPlaceTokenLite ? 'enabled' : 'disabled'}.
                </p>
            </div>
        {/if}
    {/if}
</section>

<style>
    .panel {
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 1.25rem;
        display: grid;
        gap: 1rem;
        max-width: 640px;
        background: linear-gradient(135deg, #0b1221, #0d1828);
        color: #e2e8f0;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
    }

    .heading,
    fieldset,
    .openai-panel,
    .token-place-panel {
        display: grid;
        gap: 0.75rem;
    }

    h2,
    h3,
    p {
        margin: 0;
    }

    p,
    small {
        color: #cbd5e1;
        line-height: 1.5;
    }

    fieldset {
        border: 1px solid rgba(148, 163, 184, 0.4);
        border-radius: 10px;
        padding: 1rem;
    }

    legend {
        padding: 0 0.35rem;
        font-weight: 700;
    }

    .provider-option,
    .token-lite-option {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
        padding: 0.75rem;
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 10px;
        background: rgba(15, 23, 42, 0.65);
        cursor: pointer;
    }

    .provider-option span,
    .token-lite-option span {
        display: grid;
        gap: 0.25rem;
    }

    input[type='radio'],
    input[type='checkbox'] {
        margin-top: 0.2rem;
    }

    .openai-panel {
        border-top: 1px solid rgba(148, 163, 184, 0.35);
        padding-top: 1rem;
    }

    .status,
    .token-place-note,
    .token-lite-status {
        color: #86efac;
        font-weight: 600;
    }
</style>
