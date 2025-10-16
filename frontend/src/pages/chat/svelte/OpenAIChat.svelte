<script>
    import { onMount, tick } from 'svelte';
    import { GPT35Turbo } from '../../../utils/openAI.js';
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

    $: currentPersona = $activePersona;
    $: welcomeMessage =
        currentPersona?.welcomeMessage ?? currentPersona?.welcomeSnippet ?? '';
    $: personaSummary = currentPersona?.summary;

    function addMessage(msg) {
        messageHistory.update((history) => [...history, msg]);
        messages.update((all) => [...all, msg]);
    }

    function addWelcomeMessage() {
        if (!welcomeMessage) {
            return;
        }
        const welcome = {
            role: 'assistant',
            content: welcomeMessage,
            tokens: countTokens(welcomeMessage),
        };
        addMessage(welcome);
    }

    async function submitMessage() {
        const userMessage = {
            role: 'user',
            content: $message,
            tokens: countTokens($message),
        };

        addMessage(userMessage);
        showSpinner = true;

        try {
            const aiResponse = await GPT35Turbo([...$messageHistory, userMessage], {
                persona: currentPersona,
            });
            const aiMessage = {
                role: 'assistant',
                content: aiResponse,
                tokens: countTokens(aiResponse),
            };

            addMessage(aiMessage);
        } catch (error) {
            console.error(error);
            const fallback = "Sorry, I'm having some trouble and can't generate a response.";
            addMessage({
                role: 'assistant',
                content: fallback,
                tokens: countTokens(fallback),
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
        if (selectedId === $activePersonaId) {
            return;
        }
        setActivePersona(selectedId);
        messageHistory.set([]);
        messages.set([]);
        showSpinner = false;
        message.set('');
        await tick();
        addWelcomeMessage();
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
    <div class="persona-selector">
        <label for="chat-persona">Talk to</label>
        <select id="chat-persona" bind:value={$activePersonaId} on:change={handlePersonaChange}>
            {#each personaOptions as persona}
                <option value={persona.id}>{persona.name}</option>
            {/each}
        </select>
        {#if currentPersona?.avatar}
            <img src={currentPersona.avatar} alt={`${currentPersona.name} portrait`} />
        {/if}
        {#if personaSummary}
            <p class="persona-summary">{personaSummary}</p>
        {/if}
    </div>

    <div class="vertical">
        <textarea
            class="message-textarea"
            bind:value={$message}
            on:keydown={handleKeyDown}
            style="font-size: 18px;"
        />
        <button type="button" on:click={submitMessage}>Send</button>
    </div>

    <div class="chat-container">
        <div class="spinner-container" style="display: {showSpinner ? 'flex' : 'none'}">
            <Spinner />
        </div>
        {#if $messageHistory.length}
            {#each $messageHistory.slice().reverse() as message (message.content)}
                <Message
                    messageMarkdown={message.content}
                    className={message.role}
                    timestamp={Date.now()}
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

    .persona-selector img {
        width: 100%;
        height: 140px;
        object-fit: cover;
        border-radius: 0.75rem;
    }

    .persona-summary {
        margin: 0;
        font-size: 0.9rem;
        text-align: center;
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
