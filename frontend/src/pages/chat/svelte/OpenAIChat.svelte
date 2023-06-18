<script>
    import { onMount } from 'svelte';
    import { GPT35Turbo } from '../../../utils/openAI.js';
    import { writable } from 'svelte/store';
    import Message from './Message.svelte';
    import Spinner from '../../../components/svelte/Spinner.svelte';
  
    const message = writable('');
    const messageHistory = writable([]);
    let showSpinner = false;
    let welcomeMessage = "Hello, adventurer! I'm dChat! I'm here to answer any questions you may have about DSPACE or nearly any other topic. I may accidentally generate incorrect information, so please double-check anything I say. I'm still learning! I should have some shiny new upgrades soon!";
  
    async function submitMessage() {
      const userMessage = { role: "user", content: $message };
  
      // Add the user message to the chat history immediately
      messageHistory.update(history => [...history, userMessage]);
      showSpinner = true;
  
      try {
        const aiResponse = await GPT35Turbo([...$messageHistory, userMessage]);
        const aiMessage = { role: "assistant", content: aiResponse };
  
        // Update the chat history with the assistant's message
        messageHistory.update(history => [...history, aiMessage]);
  
      } catch (error) {
        console.error(error);
        messageHistory.update(history => [...history, { role: "assistant", content: "Sorry, I'm having some trouble and can't generate a response." }]);
      }
  
      message.set(''); // clear text area
      showSpinner = false;
    }
  
    function handleKeyDown(event) {
      if (event.key === 'Enter' && event.target.tagName === 'TEXTAREA' && !event.shiftKey) {
        event.preventDefault();
        submitMessage();
      }
    }
  
    onMount(async () => {
      if ($messageHistory.length === 0) {
        messageHistory.update(history => [
          ...history,
          { role: 'assistant', content: welcomeMessage },
        ]);
      }
    });
  </script>
  
  <div class="chat">
    <div class="vertical">
      <textarea class="message-textarea" bind:value={$message} on:keydown={handleKeyDown} style="font-size: 18px;"></textarea>
      <button type="button" on:click={submitMessage}>Send</button>
    </div>
  
    <div class="chat-container">
      <div class="spinner-container" style="display: {showSpinner ? 'flex' : 'none'}">
        <Spinner />
      </div>
      {#if $messageHistory.length}
        {#each $messageHistory.slice().reverse() as message (message.content)}
          <Message messageMarkdown={message.content} className={message.role} timestamp={Date.now()} />
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
  