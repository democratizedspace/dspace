<script>
    import { onMount } from 'svelte';
    import { tokenPlaceChat } from '../../../utils/tokenPlace.js';
    import { writable } from 'svelte/store';
    import { messages, countTokens } from '../../../stores/chat.js';
    import Message from './Message.svelte';
    import Spinner from '../../../components/svelte/Spinner.svelte';

    const message = writable('');
    const messageHistory = writable([]);
    let showSpinner = false;
    let messageCounter = 0;
    let errorBanner = null;
    // Default dChat persona; callers can override for other NPCs/personas.
    export let welcomeMessage =
        "Hello, adventurer! I'm dChat! I'm here to answer any questions you may have about DSPACE or nearly any other topic. I may accidentally generate incorrect information, so please double-check anything I say.";
    export let assistantAvatar = '/assets/npc/dChat.jpg';
    export let assistantAlt = 'dChat portrait';

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

    function getTokenPlaceErrorSummary(error) {
        const message = error?.message || '';
        const normalizedMessage = message.toLowerCase();

        if (normalizedMessage.includes('disabled')) {
            return {
                type: 'disabled',
                message:
                    'token.place chat is disabled. Enable it in Settings or set the token.place ' +
                    'flag for this environment.',
            };
        }

        if (
            normalizedMessage.includes('failed to fetch') ||
            normalizedMessage.includes('network') ||
            normalizedMessage.includes('fetch')
        ) {
            return {
                type: 'network',
                message: 'We could not reach token.place. Check your connection and try again.',
            };
        }

        if (normalizedMessage.includes('api request failed')) {
            return {
                type: 'provider',
                message: 'token.place returned an error. Please try again in a moment.',
            };
        }

        return {
            type: 'unknown',
            message: 'token.place hit an unexpected error. Please try again shortly.',
        };
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
            const aiResponse = await tokenPlaceChat(historyForApi);
            const aiMessage = {
                role: 'assistant',
                content: aiResponse,
                tokens: countTokens(aiResponse),
                avatarUrl: assistantAvatar,
                avatarAlt: assistantAlt,
                timestamp: Date.now(),
            };
            addMessage(aiMessage);
        } catch (error) {
            console.error(error);
            errorBanner = getTokenPlaceErrorSummary(error);
            addMessage({
                role: 'assistant',
                content: "Sorry, I'm having some trouble and can't generate a response.",
                tokens: countTokens(
                    "Sorry, I'm having some trouble and can't generate a response."
                ),
                avatarUrl: assistantAvatar,
                avatarAlt: assistantAlt,
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

    onMount(() => {
        if ($messageHistory.length === 0) {
            const welcome = {
                role: 'assistant',
                content: welcomeMessage,
                tokens: countTokens(welcomeMessage),
                avatarUrl: assistantAvatar,
                avatarAlt: assistantAlt,
                timestamp: Date.now(),
            };
            addMessage(welcome);
        }
    });
</script>

<div class="chat" data-testid="chat-panel" data-provider="token-place">
    {#if errorBanner}
        <div class="chat-error" role="alert" data-error-type={errorBanner.type}>
            {errorBanner.message}
        </div>
    {/if}
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
        margin-top: 20px;
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
