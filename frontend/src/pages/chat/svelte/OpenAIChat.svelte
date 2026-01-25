<script>
    import { onDestroy, onMount, tick } from 'svelte';
    import {
        defaultOpenAIErrorMessage,
        describeOpenAIError,
        getOpenAIErrorSummary,
        buildChatMessages,
        GPT5Chat,
    } from '../../../utils/openAI.js';
    import { writable } from 'svelte/store';
    import {
        messages,
        countTokens,
        personaOptions,
        activePersona,
        activePersonaId,
        setActivePersona,
    } from '../../../stores/chat.js';
    import {
        loadGameState,
        ready,
        state as gameStateStore,
    } from '../../../utils/gameState/common.js';
    import { normalizeSettings } from '../../../utils/settingsDefaults.js';
    import Message from './Message.svelte';
    import Spinner from '../../../components/svelte/Spinner.svelte';

    const message = writable('');
    const messageHistory = writable([]);
    let showSpinner = false;
    let hydrated = false;
    let messageCounter = 0;
    let errorBanner = null;
    let showDebugPayload = false;
    let debugMessages = [];
    let unsubscribe;

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

    function updateDebugSetting(value) {
        const normalized = normalizeSettings(value?.settings);
        showDebugPayload = normalized.showChatDebugData;
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
        await ready;
        updateDebugSetting(loadGameState());
        unsubscribe = gameStateStore.subscribe((value) => updateDebugSetting(value));
        hydrated = true;
        if ($messageHistory.length === 0) {
            addWelcomeMessage();
        }
    });

    onDestroy(() => {
        unsubscribe?.();
    });

    $: if (hydrated && showDebugPayload) {
        debugMessages = buildChatMessages($messageHistory, {
            persona: currentPersona,
            gameState: loadGameState(),
        });
    } else if (!showDebugPayload && debugMessages.length) {
        debugMessages = [];
    }
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

    {#if showDebugPayload}
        <section class="debug-panel" data-testid="chat-debug-panel">
            <div class="debug-heading">
                <h3>Debug payload</h3>
                <p>
                    Shows the full prompt, with RAG context highlighted separately from the main
                    conversation.
                </p>
            </div>
            <div class="debug-messages">
                {#each debugMessages as debugMessage, index (index)}
                    <div
                        class={`debug-message ${
                            debugMessage.source === 'rag'
                                ? 'debug-message--rag'
                                : 'debug-message--main'
                        }`}
                    >
                        <div class="debug-message__meta">
                            <span class="debug-message__role">{debugMessage.role}</span>
                            <span class="debug-message__source">
                                {debugMessage.source === 'rag' ? 'RAG context' : 'Main content'}
                            </span>
                        </div>
                        <pre>{debugMessage.content}</pre>
                    </div>
                {/each}
            </div>
        </section>
    {/if}
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

    .debug-panel {
        width: 100%;
        background: #0f172a;
        color: #e2e8f0;
        border-radius: 0.75rem;
        padding: 1rem;
        display: grid;
        gap: 1rem;
        border: 1px solid rgba(148, 163, 184, 0.5);
    }

    .debug-heading {
        display: grid;
        gap: 0.35rem;
    }

    .debug-heading h3 {
        margin: 0;
        font-size: 1rem;
    }

    .debug-heading p {
        margin: 0;
        font-size: 0.85rem;
        color: #cbd5e1;
    }

    .debug-messages {
        display: grid;
        gap: 0.75rem;
    }

    .debug-message {
        border-radius: 0.6rem;
        padding: 0.75rem;
        border: 1px solid transparent;
    }

    .debug-message--main {
        background: rgba(15, 118, 110, 0.2);
        border-color: rgba(94, 234, 212, 0.4);
    }

    .debug-message--rag {
        background: rgba(59, 130, 246, 0.18);
        border-color: rgba(96, 165, 250, 0.5);
    }

    .debug-message__meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 0.5rem;
        color: #e2e8f0;
    }

    .debug-message__role {
        color: #e2e8f0;
    }

    .debug-message__source {
        color: #cbd5e1;
    }

    .debug-message pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 0.85rem;
        font-family: 'SFMono-Regular', SFMono-Regular, ui-monospace, monospace;
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
</style>
