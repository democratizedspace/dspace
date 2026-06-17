<script>
    import { onDestroy, onMount } from 'svelte';
    import {
        loadGameState,
        ready,
        saveGameState,
        state as gameStateStore,
    } from '../../utils/gameState/common.js';
    import { normalizeSettings } from '../../utils/settingsDefaults.js';

    const TOKEN_PLACE = 'token-place';
    const OPENAI = 'openai';

    let hydrated = false;
    let loading = true;
    let savingProvider = false;
    let savingKey = false;
    let chatProvider = TOKEN_PLACE;
    let savedApiKey = '';
    let draftApiKey = '';
    let editingApiKey = false;
    let statusMessage = '';
    let errorMessage = '';
    let unsubscribe;

    const syncFromState = (value) => {
        const normalized = normalizeSettings(value?.settings);
        chatProvider = normalized.chatProvider;
        savedApiKey = value?.openAI?.apiKey || '';
        if (!editingApiKey) {
            draftApiKey = '';
        }
    };

    onMount(async () => {
        await ready;
        syncFromState(loadGameState());
        unsubscribe = gameStateStore.subscribe((value) => syncFromState(value));
        editingApiKey = !savedApiKey;
        hydrated = true;
        loading = false;
    });

    onDestroy(() => {
        unsubscribe?.();
    });

    const persistProvider = async (provider) => {
        await ready;
        savingProvider = true;
        statusMessage = '';
        errorMessage = '';

        try {
            const current = loadGameState();
            const nextSettings = {
                ...normalizeSettings(current.settings),
                chatProvider: provider,
            };

            await saveGameState({
                ...current,
                settings: nextSettings,
            });

            chatProvider = provider;
            statusMessage =
                provider === OPENAI
                    ? 'OpenAI selected. Save your API key below to use it in Chat.'
                    : 'token.place selected. No API key is required.';
        } catch (error) {
            console.error('Failed to save chat provider setting', error);
            errorMessage = 'Unable to save Chat provider. Please try again.';
        } finally {
            savingProvider = false;
        }
    };

    const handleProviderChange = async (event) => {
        const nextProvider = event.currentTarget.value;
        if (nextProvider === chatProvider || savingProvider) {
            return;
        }
        chatProvider = nextProvider;
        await persistProvider(nextProvider);
    };

    const saveApiKey = async () => {
        await ready;
        savingKey = true;
        statusMessage = '';
        errorMessage = '';

        try {
            const current = loadGameState();
            await saveGameState({
                ...current,
                openAI: {
                    ...(current.openAI || {}),
                    apiKey: draftApiKey.trim(),
                },
            });
            savedApiKey = draftApiKey.trim();
            draftApiKey = '';
            editingApiKey = !savedApiKey;
            statusMessage = savedApiKey
                ? 'OpenAI API key saved on this device.'
                : 'OpenAI API key cleared.';
        } catch (error) {
            console.error('Failed to save OpenAI API key', error);
            errorMessage = 'Unable to save OpenAI API key. Please try again.';
        } finally {
            savingKey = false;
        }
    };

    const clearApiKey = async () => {
        draftApiKey = '';
        await saveApiKey();
    };

    const editApiKey = () => {
        draftApiKey = '';
        editingApiKey = true;
        statusMessage = '';
        errorMessage = '';
    };
</script>

<section class="panel chat-provider-settings" data-hydrated={hydrated ? 'true' : 'false'}>
    <div class="heading">
        <h3>Chat provider</h3>
        <p>
            token.place is the default DSPACE Chat provider. It works without authentication or a
            user-managed API key. Select OpenAI only if you want to use your own API key.
        </p>
    </div>

    {#if hydrated}
        <fieldset class="provider-options" disabled={loading || savingProvider}>
            <legend>Choose the provider for NPC Chat</legend>
            <label class="provider-option">
                <input
                    type="radio"
                    name="chat-provider"
                    value={TOKEN_PLACE}
                    checked={chatProvider === TOKEN_PLACE}
                    on:change={handleProviderChange}
                    data-testid="chat-provider-token-place"
                />
                <span>
                    <strong>token.place</strong>
                    <small>Default. No auth or API key required.</small>
                </span>
            </label>
            <label class="provider-option">
                <input
                    type="radio"
                    name="chat-provider"
                    value={OPENAI}
                    checked={chatProvider === OPENAI}
                    on:change={handleProviderChange}
                    data-testid="chat-provider-openai"
                />
                <span>
                    <strong>OpenAI</strong>
                    <small>Opt in with an API key saved locally in this browser.</small>
                </span>
            </label>
        </fieldset>

        {#if chatProvider === OPENAI}
            <div class="openai-key-panel" data-testid="openai-key-panel">
                <h4>OpenAI API key</h4>
                <p>
                    OpenAI keys stay in your existing local save at <code>openAI.apiKey</code> for backwards
                    compatibility. Saved keys are hidden here after configuration.
                </p>

                {#if savedApiKey && !editingApiKey}
                    <p class="configured" data-testid="openai-key-configured">
                        OpenAI API key configured on this device.
                    </p>
                    <div class="actions">
                        <button type="button" on:click={editApiKey}>Edit key</button>
                        <button
                            class="danger"
                            type="button"
                            on:click={clearApiKey}
                            disabled={savingKey}
                        >
                            {savingKey ? 'Clearing…' : 'Clear key'}
                        </button>
                    </div>
                {:else}
                    <form on:submit|preventDefault={saveApiKey}>
                        <label for="openai-api-key">OpenAI API key</label>
                        <input
                            id="openai-api-key"
                            type="password"
                            autocomplete="off"
                            bind:value={draftApiKey}
                            placeholder="sk-..."
                            data-testid="openai-api-key-input"
                        />
                        <div class="actions">
                            <button type="submit" disabled={savingKey}>
                                {savingKey ? 'Saving…' : 'Save OpenAI key'}
                            </button>
                            <button
                                class="danger"
                                type="button"
                                on:click={clearApiKey}
                                disabled={savingKey && !savedApiKey}
                            >
                                Clear key
                            </button>
                        </div>
                    </form>
                {/if}
            </div>
        {:else}
            <p class="token-place-note" data-testid="token-place-no-key-note">
                token.place is ready for Chat and does not need any credential field.
            </p>
        {/if}

        {#if statusMessage}
            <p class="status" role="status" data-testid="chat-provider-status">{statusMessage}</p>
        {/if}
        {#if errorMessage}
            <p class="error" role="alert">{errorMessage}</p>
        {/if}
    {:else}
        <p class="status">Loading Chat provider settings…</p>
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
    h4,
    p {
        margin: 0;
    }

    p,
    small,
    legend,
    label {
        color: #cbd5e1;
        line-height: 1.5;
    }

    .heading {
        display: grid;
        gap: 0.35rem;
    }

    .provider-options,
    .openai-key-panel {
        border: 1px solid rgba(148, 163, 184, 0.4);
        border-radius: 10px;
        padding: 1rem;
        display: grid;
        gap: 0.75rem;
        background: rgba(15, 23, 42, 0.65);
    }

    .provider-option {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
        cursor: pointer;
    }

    .provider-option span,
    form {
        display: grid;
        gap: 0.25rem;
    }

    input[type='radio'] {
        margin-top: 0.3rem;
    }

    input[type='password'] {
        border: 1px solid #475569;
        border-radius: 8px;
        padding: 0.65rem;
        font-size: 1rem;
        background: #020617;
        color: #e2e8f0;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 0.5rem;
    }

    button {
        background: #15803d;
        border: 1px solid #22c55e;
        border-radius: 8px;
        color: #fff;
        cursor: pointer;
        font-size: 1rem;
        padding: 10px 18px;
    }

    button.danger {
        background: #8a2c2c;
        border-color: #fca5a5;
    }

    button[disabled],
    fieldset[disabled] {
        opacity: 0.7;
        cursor: progress;
    }

    .configured,
    .status {
        color: #86efac;
    }

    .error {
        color: #fecaca;
    }

    .token-place-note {
        border-left: 4px solid #22c55e;
        padding-left: 0.75rem;
        color: #bbf7d0;
    }
</style>
