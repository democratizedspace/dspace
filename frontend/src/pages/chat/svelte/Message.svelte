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
    export let avatarAlt = 'NPC portrait';
    export let debugSegments = null;
    export let showDebug = false;

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

    function applyAvatarRole(node) {
        node.setAttribute('role', 'img');
        return {
            destroy() {
                node.removeAttribute('role');
            },
        };
    }
</script>

<div class="message-row">
    {#if className === 'assistant' && avatarUrl}
        <img class="avatar" src={avatarUrl} alt={avatarAlt} use:applyAvatarRole />
    {:else}
        <div class="avatar-spacer" aria-hidden="true"></div>
    {/if}
    <div class={`message-bubble ${className}`}>
        <div class="timestamp" title={format(new Date(timestamp), 'PPpp')}>
            {formatRelative(new Date(timestamp), new Date())}
        </div>
        {@html messageHtml}
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
        {#if showDebug && debugSegments?.length}
            <div class="debug-prompt" aria-label="Chat prompt debug payload">
                <div class="debug-header">Prompt payload</div>
                {#each debugSegments as segment}
                    <div class={`debug-block ${segment.type}`}>
                        <div class="debug-label">{segment.label}</div>
                        <pre>{segment.content}</pre>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .message-row {
        display: grid;
        grid-template-columns: 32px minmax(0, 1fr);
        align-items: start;
        gap: 0.5rem;
        width: 100%;
    }

    .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
    }

    .message-bubble.user,
    .message-bubble.assistant {
        padding: 10px;
        font-size: 16px;
        border-radius: 5px;
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 10px;
        max-width: 100%;
        min-width: 0;
        color: white;
    }

    .message-bubble.user {
        justify-self: end;
        background-color: #007006;
    }

    .message-bubble.assistant .timestamp {
        color: #4d4d4d;
    }

    .message-bubble.user .timestamp {
        color: #f0f0f0;
    }

    .message-bubble.assistant {
        justify-self: start;
        background-color: #dddddd;
        color: black;
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

    .debug-prompt {
        margin-top: 12px;
        border-radius: 8px;
        border: 1px solid rgba(148, 163, 184, 0.5);
        background: rgba(15, 23, 42, 0.08);
        padding: 10px;
        display: grid;
        gap: 8px;
        color: #0f172a;
    }

    .debug-header {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #0f172a;
    }

    .debug-block {
        border-radius: 6px;
        padding: 8px;
        border: 1px solid transparent;
        display: grid;
        gap: 4px;
        font-size: 0.85rem;
        white-space: pre-wrap;
        word-break: break-word;
    }

    .debug-block pre {
        margin: 0;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        white-space: pre-wrap;
        word-break: break-word;
    }

    .debug-block.main {
        background: rgba(59, 130, 246, 0.12);
        border-color: rgba(37, 99, 235, 0.4);
    }

    .debug-block.rag {
        background: rgba(217, 70, 239, 0.12);
        border-color: rgba(192, 38, 211, 0.4);
    }

    .debug-label {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #0f172a;
    }

    .avatar-spacer {
        width: 32px;
        height: 32px;
    }
</style>
