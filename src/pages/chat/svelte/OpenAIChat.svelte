<script>
    import { onMount } from 'svelte';
    import { GPT35Turbo } from '../../../utils/openAI.js';
    import { writable } from 'svelte/store';
    import Message from './Message.svelte';
    import Spinner from '../../../components/svelte/Spinner.svelte';

    const message = writable('');
    const messageHistory = writable([]);
    let showSpinner = false;
    let welcomeMessage =
        'Hello, adventurer! I\'m dChat! I\'m here to answer any questions you may have about DSPACE or nearly any other topic. I may accidentally generate incorrect information, so please double-check anything I say. I\'m still learning! I should have some shiny new upgrades soon!';

    async function submitMessage() {
        const userMessage = { role: 'user', content: $message };

        // Add the user message to the chat history immediately
        messageHistory.update((history) => [...history, userMessage]);
        showSpinner = true;

        try {
            const aiResponse = await GPT35Turbo([...$messageHistory, userMessage]);
            const aiMessage = { role: 'assistant', content: aiResponse };

            // Update the chat history with the assistant's message
            messageHistory.update((history) => [...history, aiMessage]);
        } catch (error) {
            console.error(error);
            messageHistory.update((history) => [
                ...history,
                {
                    role: 'assistant',
                    content: 'Sorry, I\'m having some trouble and can\'t generate a response.',
                },
            ]);
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
            messageHistory.update((history) => [
                ...history,
                { role: 'assistant', content: welcomeMessage },
            ]);
        }
    });
</script> 