<script>
    import { onMount, tick } from 'svelte';
    import {
        defaultOpenAIErrorMessage,
        describeOpenAIError,
        getOpenAIErrorInfo,
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
    import Message from './Message.svelte';
    import Spinner from '../../../components/svelte/Spinner.svelte';

    const message = writable('');
    const messageHistory = writable([]);
    let showSpinner = false;
    let hydrated = false;
    let messageCounter = 0;
    let errorBanner = null;

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

        errorBanner = null;
        addMessage(userMessage);
        const historyForApi = [...$messageHistory];
        showSpinner = true;

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
            const errorInfo = getOpenAIErrorInfo(error);
            errorBanner = errorInfo;
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
        message.set('');
        await tick();
        addWelcomeMessage(nextPersona);
    }

    onMount(async () => {
        hydrated = true;
        if ($messageHistory.length === 0) {
            addWelcomeMessage();
        }
    });
</script>

<div
    class="chat"
    data-testid="chat-panel"
    data-provider="openai"
    data-hydrated={hydrated ? 'true' : 'false'}
>
    {#if errorBanner}
        <div class="error-banner" role="alert">
            <strong>{errorBanner.title}</strong>
            <span>{errorBanner.message}</span>
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

    .error-banner {
        width: 100%;
        background: rgba(127, 29, 29, 0.12);
        border: 1px solid rgba(127, 29, 29, 0.35);
        color: #7f1d1d;
        border-radius: 10px;
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 0.95rem;
    }

    .error-banner strong {
        font-size: 1rem;
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
