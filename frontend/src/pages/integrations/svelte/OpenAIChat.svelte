<script> 
    import { GPT35Turbo } from '../../../utils/openAI.js';
    import { writable } from 'svelte/store';

    const message = writable('');
    const messageHistory = writable([]);

    async function submitMessage() {
        const userMessage = { role: "user", content: $message };

        try {
            const aiMessage = { role: "assistant", content: await GPT35Turbo([...$messageHistory, userMessage]) };
            messageHistory.update(history => [...history, userMessage, aiMessage]);

        } catch (error) {
            if (error.response) {
                console.log(error.response.status);
                console.log(error.response.data);
            } else {
                console.log(error.message);
            }
        }

        message.set(''); // clear text area
    }




function handleKeyDown(event) {
    if (event.key === 'Enter' && event.target.tagName === 'TEXTAREA') {
        event.preventDefault();
        submitMessage();
    }
}
</script>

<div class="chat">
    <div class="vertical">
        <textarea class="message-textarea" bind:value={$message} on:keydown={handleKeyDown} style="font-size: 18px;"></textarea>
        <button type="button" on:click={submitMessage}>Send</button>
    </div>

    <div class="chat-container">
        {#if $messageHistory.length}
            {#each $messageHistory.slice().reverse() as message}
                <div class="message">
                    {#if message.role === "user"}
                        <div class="user-message">{message.content}</div>
                    {:else}
                        <div class="assistant-message">{message.content}</div>
                    {/if}
                </div>
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

    .vertical {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        margin-top: 20px;
    }

    .message {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .user-message, .assistant-message {
        padding: 10px;
        font-size: 16px;
        border-radius: 5px;
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 10px;
        max-width: 80%;
    }

    .user-message {
        background-color: #007006;
        align-self: flex-end;
        color: white;
    }

    .assistant-message {
        background-color: white;
        align-self: flex-start;
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
