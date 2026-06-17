<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { loadGameState, ready, saveGameState } from '../../utils/gameState/common.js';
    import { normalizeSettings } from '../../utils/settingsDefaults.js';
    import OpenAIAPIKeySettings from './OpenAIAPIKeySettings.svelte';

    const OPENAI_PROVIDER = 'openai';
    const TOKEN_PLACE_PROVIDER = 'token-place';

    let hydrated = false;
    let chatProvider = TOKEN_PLACE_PROVIDER;
    let statusMessage = '';
    let saving = false;
    const apiKey = writable('');

    onMount(async () => {
        await ready;
        const current = loadGameState();
        const normalized = normalizeSettings(current.settings);
        chatProvider = normalized.chatProvider;
        apiKey.set(current.openAI?.apiKey || '');
        hydrated = true;
    });

    async function persistProvider(nextProvider) {
        const normalizedProvider =
            nextProvider === OPENAI_PROVIDER ? OPENAI_PROVIDER : TOKEN_PLACE_PROVIDER;
        chatProvider = normalizedProvider;
        saving = true;
        statusMessage = '';
        await ready;
        const current = loadGameState();
        const settings = normalizeSettings(current.settings);
        await saveGameState({
            ...current,
            settings: {
                ...settings,
                chatProvider: normalizedProvider,
            },
        });
        statusMessage =
            normalizedProvider === OPENAI_PROVIDER
                ? 'OpenAI selected for Chat. Add your API key below to use it.'
                : 'token.place selected for Chat. No API key is required.';
        saving = false;
    }
</script>

<section class="panel chat-provider-settings" data-hydrated={hydrated ? 'true' : 'false'}>
    <div class="heading">
        <h3>Chat provider</h3>
        <p>
            token.place is the default Chat provider for DSPACE and works without auth or an API
            key. Choose OpenAI only if you want to use your own OpenAI API key.
        </p>
    </div>

    {#if hydrated}
        <fieldset disabled={saving}>
            <legend>Choose Chat provider</legend>
            <label class="provider-option">
                <input
                    type="radio"
                    name="chat-provider"
                    value={TOKEN_PLACE_PROVIDER}
                    checked={chatProvider === TOKEN_PLACE_PROVIDER}
                    on:change={() => persistProvider(TOKEN_PLACE_PROVIDER)}
                />
                <span>
                    <strong>token.place</strong>
                    <small>Default provider. No Chat credential or token.place key required.</small>
                </span>
            </label>
            <label class="provider-option">
                <input
                    type="radio"
                    name="chat-provider"
                    value={OPENAI_PROVIDER}
                    checked={chatProvider === OPENAI_PROVIDER}
                    on:change={() => persistProvider(OPENAI_PROVIDER)}
                />
                <span>
                    <strong>OpenAI</strong>
                    <small>Optional provider. Uses your saved OpenAI API key on this device.</small>
                </span>
            </label>
        </fieldset>

        {#if chatProvider === OPENAI_PROVIDER}
            <div class="openai-panel">
                <OpenAIAPIKeySettings {apiKey} />
            </div>
        {:else}
            <p class="token-place-note" data-testid="token-place-no-key-note">
                token.place Chat is ready with no API key. This settings panel intentionally has no
                token.place credential field.
            </p>
        {/if}

        {#if statusMessage}
            <p class="status" role="status" data-testid="chat-provider-status">{statusMessage}</p>
        {/if}
    {:else}
        <p>Loading Chat provider settings…</p>
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
        background: rgba(15, 23, 42, 0.65);
        border: 1px solid rgba(148, 163, 184, 0.35);
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        gap: 0.75rem;
        padding: 0.8rem;
    }

    .provider-option span {
        display: grid;
        gap: 0.2rem;
    }

    input[type='radio'] {
        margin-top: 0.2rem;
    }

    .openai-panel {
        border-top: 1px solid rgba(148, 163, 184, 0.35);
        padding-top: 1rem;
    }

    .token-place-note,
    .status {
        color: #bbf7d0;
        font-weight: 600;
    }
</style>
