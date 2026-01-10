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
    // Default dChat persona; callers can override for other NPCs/personas.
    export let welcomeMessage =
        "Hello, adventurer! I'm dChat! I'm here to answer any questions you may have about DSPACE or nearly any other topic. I may accidentally generate incorrect information, so please double-check anything I say.";
    export let assistantAvatar = '/assets/npc/dChat.jpg';
    export let assistantAlt = 'dChat portrait';

    function addMessage(msg) {
        const timestampedMessage = {
            ...msg,
            timestamp: msg.timestamp ?? Date.now(),
        };
        messageHistory.update((history) => [...history, timestampedMessage]);
        messages.update((all) => [...all, timestampedMessage]);
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
            {#each $messageHistory.slice().reverse() as message (message.content)}
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
