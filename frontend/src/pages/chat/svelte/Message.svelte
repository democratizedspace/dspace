<script>
    import { onMount } from 'svelte';
    import DOMPurify from 'dompurify';
    import hljs from 'highlight.js';
    import 'highlight.js/styles/default.css';
    import { Remarkable } from 'remarkable';
    import { formatRelative, format } from 'date-fns';
    import { fade } from 'svelte/transition';
    import { copyToClipboard } from '../../../utils/copyToClipboard.js';

    export let messageMarkdown;
    export let className;
    export let timestamp;
    export let avatarUrl = null;
    export let avatarAlt = null;

    let messageHtml;
    const md = new Remarkable({
        html: true,
        breaks: true,
        langPrefix: 'hljs language-',
    });

    const languageMapping = {
        py: 'python',
        js: 'javascript',
    };

    md.renderer.rules.fence = (tokens, idx) => {
        const token = tokens[idx];
        let language = token.info ? token.info.trim() : '';
        language = languageMapping[language] ? languageMapping[language] : language;
        const code = token.content.trim();
        const languageLabel = language ? `<span class="language-label">${language}</span>` : '';

        return `<div>${languageLabel}<pre title="${language}"><code class="hljs ${language}">${
            hljs.highlightAuto(code).value
        }</code><button class="copy-button" type="button" aria-label="Copy code to clipboard">Copy</button></pre></div>`;
    };

    $: {
        let rawHtml = md.render(messageMarkdown);
        messageHtml = DOMPurify.sanitize(rawHtml);
    }

    let toastVisible = false;

    function handleCopyButton(event) {
        if (event.target.classList.contains('copy-button')) {
            const pre = event.target.parentNode;
            const code = pre.querySelector('code').innerText;
            copyToClipboard(code);
            toastVisible = true;
            setTimeout(() => {
                toastVisible = false;
            }, 3000);
        }
    }

    onMount(() => {
        const copyButtons = document.querySelectorAll('.copy-button');
        copyButtons.forEach((button) => {
            button.addEventListener('click', handleCopyButton);
            button.addEventListener('mouseover', () => {
                button.style.opacity = '1';
                button.style.backgroundColor = '#68d46d';
                button.style.color = 'black';
            });
            button.addEventListener('mouseout', () => {
                button.style.opacity = '0.8';
                button.style.backgroundColor = '#007006';
                button.style.color = 'white';
            });
        });

        return () => {
            copyButtons.forEach((button) => {
                button.removeEventListener('click', handleCopyButton);
            });
        };
    });
</script>

<div class={`message-row ${className} ${avatarUrl ? 'has-avatar' : 'no-avatar'}`}>
    {#if avatarUrl}
        <img class="message-avatar" src={avatarUrl} alt={avatarAlt || 'NPC avatar'} />
    {/if}
    <div class={`message-bubble ${className}`}>
        <div class="timestamp" title={format(new Date(timestamp), 'PPpp')}>
            {formatRelative(new Date(timestamp), new Date())}
        </div>
        <div class="message-body">{@html messageHtml}</div>
        {#if toastVisible}
            <div
                class="toast"
                role="status"
                aria-live="polite"
                transition:fade={{ delay: 2000, duration: 1000 }}
            >
                Copied to clipboard
            </div>
        {/if}
    </div>
</div>

<style>
    .message-row {
        display: flex;
        gap: 0.5rem;
        align-items: flex-start;
        max-width: 100%;
        width: 100%;
    }

    .message-row.no-avatar {
        gap: 0;
    }

    .message-row.user {
        justify-content: flex-end;
    }

    .message-row.assistant {
        justify-content: flex-start;
    }

    .message-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
    }

    .message-bubble {
        padding: 10px;
        font-size: 16px;
        border-radius: 5px;
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 10px;
        max-width: 80%;
        color: white;
    }

    .message-bubble.user {
        background-color: #007006;
    }

    .message-bubble.assistant .timestamp {
        color: #4d4d4d;
    }

    .message-bubble.user .timestamp {
        color: #f0f0f0;
    }

    .message-bubble.assistant {
        background-color: #dddddd;
        color: black;
    }

    .message-body {
        overflow-wrap: anywhere;
        word-break: break-word;
        white-space: pre-wrap;
    }

    .message-body pre {
        max-width: 100%;
        overflow-x: auto;
    }

    .timestamp {
        font-size: 12px;
        margin-bottom: 5px;
    }

    .copy-button {
        position: absolute;
        top: 0;
        right: 0;
        background-color: #007006;
        border-radius: 0.4rem;
        color: white;
        font-size: 0.8em;
        padding: 4px;
        margin: 1px;
        text-align: center;
        transition: 200ms linear;
        border: none;
        opacity: 0.8;
    }

    .copy-button:hover {
        opacity: 1;
        background-color: #68d46d;
        color: black;
        cursor: pointer;
    }

    .copy-button:focus-visible {
        outline: 2px solid #000;
        outline-offset: 2px;
    }

    .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #cacaca;
        color: #fff;
        padding: 10px 20px;
        border-radius: 5px;
        text-align: center;
    }
</style>
