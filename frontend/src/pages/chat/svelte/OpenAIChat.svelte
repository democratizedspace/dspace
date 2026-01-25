<script>
    import { onDestroy, onMount, tick } from 'svelte';
    import {
        defaultOpenAIErrorMessage,
        describeOpenAIError,
        getOpenAIErrorSummary,
        buildChatPayload,
        GPT5Chat,
    } from '../../../utils/openAI.js';
    import {
        loadGameState,
        ready,
        state as gameStateStore,
    } from '../../../utils/gameState/common.js';
    import { normalizeSettings } from '../../../utils/settingsDefaults.js';
    import { writable } from 'svelte/store';
    import {
        messages,
        countTokens,
        personaOptions,
        activePersona,
        activePersonaId,
        setActivePersona,
    } from '../../../stores/chat.js';
    import Message from './Message.svelte';
    import Spinner from '../../../components/svelte/Spinner.svelte';

    const message = writable('');
    const messageHistory = writable([]);
    let showSpinner = false;
    let hydrated = false;
    let messageCounter = 0;
    let errorBanner = null;
    let showDebug = false;
    let debugPayload = [];
    let settingsUnsubscribe;

    $: currentPersona = $activePersona;
    $: personaSummary = currentPersona?.summary;

    function getWelcomeText(persona) {
        return persona?.welcomeMessage ?? persona?.welcomeSnippet ?? '';
    }

    function getPersonaAvatar(persona) {
        return persona?.avatar ?? null;
    }

    function getPersonaAlt(persona) {
        return persona?.name ? `${persona.name} portrait` : 'NPC portrait';
    }

    function createMessageId() {
        messageCounter += 1;
        return `${Date.now()}-${messageCounter}`;
    }

    function addMessage(msg) {
        const timestampedMessage = {
            ...msg,
            timestamp: msg.timestamp ?? Date.now(),
            id: msg.id ?? createMessageId(),
        };
        messageHistory.update((history) => [...history, timestampedMessage]);
        messages.update((all) => [...all, timestampedMessage]);
    }

    function addWelcomeMessage(persona = currentPersona) {
        const welcomeText = getWelcomeText(persona);
        if (!welcomeText) {
            return;
        }
        const welcome = {
            role: 'assistant',
            content: welcomeText,
            tokens: countTokens(welcomeText),
            avatarUrl: getPersonaAvatar(persona),
            avatarAlt: getPersonaAlt(persona),
            timestamp: Date.now(),
        };
        addMessage(welcome);
    }

    async function submitMessage() {
        const userMessage = {
            role: 'user',
            content: $message,
            tokens: countTokens($message),
            timestamp: Date.now(),
        };

        addMessage(userMessage);
        const historyForApi = [...$messageHistory];
        const { debugEntries } = await buildChatPayload(historyForApi, {
            persona: currentPersona,
        });
        debugPayload = debugEntries;
        showSpinner = true;
        errorBanner = null;

        try {
            const aiResponse = await GPT5Chat(historyForApi, {
                persona: currentPersona,
            });
            const aiMessage = {
                role: 'assistant',
                content: aiResponse,
                tokens: countTokens(aiResponse),
                avatarUrl: getPersonaAvatar(currentPersona),
                avatarAlt: getPersonaAlt(currentPersona),
                timestamp: Date.now(),
            };

            addMessage(aiMessage);
        } catch (error) {
            console.error('OpenAI chat request failed', error);
            errorBanner = getOpenAIErrorSummary(error);
            const fallback = describeOpenAIError(error) || defaultOpenAIErrorMessage;
            addMessage({
                role: 'assistant',
                content: fallback,
                tokens: countTokens(fallback),
                avatarUrl: getPersonaAvatar(currentPersona),
                avatarAlt: getPersonaAlt(currentPersona),
                timestamp: Date.now(),
            });
        }

        message.set('');
        showSpinner = false;
    }

    function handleKeyDown(event) {
        if (event.key === 'Enter' && event.target.tagName === 'TEXTAREA' && !event.shiftKey) {
            event.preventDefault();
            submitMessage();
        }
    }

    async function handlePersonaChange(event) {
        const selectedId = event.target.value;
        const nextPersona =
            personaOptions.find((option) => option.id === selectedId) || currentPersona;

        setActivePersona(selectedId);
        messageHistory.set([]);
        messages.set([]);
        showSpinner = false;
        errorBanner = null;
        message.set('');
        await tick();
        addWelcomeMessage(nextPersona);
    }

    onMount(async () => {
        hydrated = true;
        await ready;
        const syncSettings = (value) => {
            const normalized = normalizeSettings(value?.settings);
            showDebug = normalized.showChatDebugData;
        };
        syncSettings(loadGameState());
        settingsUnsubscribe = gameStateStore.subscribe((value) => syncSettings(value));
        if ($messageHistory.length === 0) {
            addWelcomeMessage();
        }
    });

    onDestroy(() => {
        settingsUnsubscribe?.();
    });
</script>

<div
    class="chat"
    data-testid="chat-panel"
    data-provider="openai"
    data-hydrated={hydrated ? 'true' : 'false'}
>
    {#if errorBanner}
        <div class="chat-error" role="alert" data-error-type={errorBanner.type}>
            {errorBanner.message}
        </div>
    {/if}
    <div class="persona-selector">
        <label for="chat-persona">Talk to</label>
        <select id="chat-persona" bind:value={$activePersonaId} on:change={handlePersonaChange}>
            {#each personaOptions as persona}
                <option value={persona.id}>{persona.name}</option>
            {/each}
        </select>
        {#if currentPersona?.avatar || personaSummary}
            <div class="persona-details">
                {#if currentPersona?.avatar}
                    <img src={currentPersona.avatar} alt={getPersonaAlt(currentPersona)} />
                {/if}
                {#if personaSummary}
                    <p class="persona-summary">{personaSummary}</p>
                {/if}
            </div>
        {/if}
    </div>

    <div class="vertical">
        <textarea
            class="message-textarea"
            bind:value={$message}
            on:keydown={handleKeyDown}
            style="font-size: 18px;"
        ></textarea>
        <button type="button" on:click={submitMessage}>Send</button>
    </div>

    <div class="chat-container">
        <div class="spinner-container" style="display: {showSpinner ? 'flex' : 'none'}">
            <Spinner />
        </div>
        {#if showDebug}
            <section class="chat-debug" aria-live="polite">
                <div class="chat-debug__header">
                    <h3>Debug: chat prompt payload</h3>
                    <div class="chat-debug__legend">
                        <span class="debug-pill debug-pill--rag">RAG context</span>
                        <span class="debug-pill debug-pill--main">Main messages</span>
                    </div>
                </div>
                {#if debugPayload.length}
                    <div class="chat-debug__entries">
                        {#each debugPayload as entry, index (index)}
                            <div class={`chat-debug__entry chat-debug__entry--${entry.contextType}`}>
                                <div class="chat-debug__meta">{entry.role}</div>
                                <pre>{entry.content}</pre>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="chat-debug__empty">
                        Send a message to capture the current payload.
                    </p>
                {/if}
            </section>
        {/if}
        {#if $messageHistory.length}
            {#each $messageHistory.slice().reverse() as message (message.id)}
                <Message
                    messageMarkdown={message.content}
                    className={message.role}
                    timestamp={message.timestamp}
                    avatarUrl={message.avatarUrl}
                    avatarAlt={message.avatarAlt}
                />
            {/each}
        {/if}
    </div>
</div>

<style>
    .chat {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        gap: 1.5rem;
    }

    .persona-selector {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
    }

    .persona-selector label {
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.08em;
    }

    .persona-selector select {
        width: 100%;
        padding: 0.5rem;
        border-radius: 0.5rem;
        border: none;
        font-size: 1rem;
    }

    .persona-details {
        display: flex;
        align-items: center;
        gap: 1rem;
        width: 100%;
        justify-content: center;
        flex-wrap: wrap;
    }

    .persona-details img {
        width: min(128px, 40vw);
        height: min(128px, 40vw);
        object-fit: cover;
        border-radius: 0.75rem;
        flex-shrink: 0;
    }

    .persona-summary {
        margin: 0;
        font-size: 0.9rem;
        text-align: left;
        color: rgba(0, 0, 0, 0.8);
    }

    .chat-error {
        width: 100%;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(248, 113, 113, 0.6);
        background: rgba(254, 226, 226, 0.9);
        color: #7f1d1d;
        font-size: 0.95rem;
        line-height: 1.4;
        margin-bottom: 0.5rem;
    }

    .chat-container {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
        gap: 1rem;
    }

    .vertical {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
    }

    .spinner-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        margin-top: 20px;
    }

    button {
        height: 40px;
        border-radius: 5px;
        margin-top: 10px;
        margin-bottom: 10px;
        background-color: #1f2937;
        color: white;
        border: none;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    }

    textarea {
        width: 100%;
        height: 100px;
        border-radius: 5px;
        border: none;
        padding: 10px;
        font-size: 16px;
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    }

    .chat-debug {
        width: 100%;
        border: 1px solid rgba(148, 163, 184, 0.5);
        border-radius: 12px;
        padding: 1rem;
        background: #f8fafc;
        color: #0f172a;
        display: grid;
        gap: 0.75rem;
    }

    .chat-debug__header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
    }

    .chat-debug__header h3 {
        margin: 0;
        font-size: 1rem;
    }

    .chat-debug__legend {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .debug-pill {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        border: 1px solid transparent;
    }

    .debug-pill--rag {
        background: rgba(244, 114, 182, 0.15);
        border-color: rgba(244, 114, 182, 0.45);
        color: #9d174d;
    }

    .debug-pill--main {
        background: rgba(59, 130, 246, 0.12);
        border-color: rgba(59, 130, 246, 0.4);
        color: #1e3a8a;
    }

    .chat-debug__entries {
        display: grid;
        gap: 0.75rem;
    }

    .chat-debug__entry {
        border-radius: 10px;
        padding: 0.75rem;
        border: 1px solid rgba(148, 163, 184, 0.4);
        background: #fff;
        display: grid;
        gap: 0.5rem;
    }

    .chat-debug__entry--rag {
        background: rgba(244, 114, 182, 0.08);
        border-color: rgba(244, 114, 182, 0.4);
    }

    .chat-debug__entry--main {
        background: rgba(59, 130, 246, 0.08);
        border-color: rgba(59, 130, 246, 0.35);
    }

    .chat-debug__meta {
        text-transform: uppercase;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #334155;
    }

    .chat-debug__entry pre {
        margin: 0;
        font-size: 0.85rem;
        line-height: 1.4;
        white-space: pre-wrap;
        word-break: break-word;
    }

    .chat-debug__empty {
        margin: 0;
        color: #64748b;
        font-size: 0.9rem;
    }
</style>
