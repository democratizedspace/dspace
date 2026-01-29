<script>
    import { onMount } from 'svelte';
    import DOMPurify from 'dompurify';
    import hljs from 'highlight.js';
    import 'highlight.js/styles/default.css';
    import { Remarkable } from 'remarkable';
    import { formatRelative, format } from 'date-fns';
    import { fade } from 'svelte/transition';
    import { copyToClipboard } from '../../../utils/copyToClipboard.js';
    import { sortSources } from '../../../utils/contextSources.js';

    export let messageMarkdown;
    export let className;
    export let timestamp;
    export let avatarUrl = null;
    export let avatarAlt = 'NPC portrait';
    export let contextSources = [];

    let messageHtml;
    let sortedSources = [];
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

    $: sortedSources = Array.isArray(contextSources) ? sortSources(contextSources) : [];

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
        {#if className === 'assistant' && sortedSources.length}
            <details class="sources" data-testid="assistant-sources">
                <summary>Sources used</summary>
                <ul>
                    {#each sortedSources as source (`${source.type}-${source.id}-${source.url || ''}`)}
                        <li>
                            <span class={`source-type source-type--${source.type}`}>
                                {source.type}
                            </span>
                            <span class="source-label">{source.label}</span>
                            {#if source.url}
                                <a class="source-link" href={source.url}>{source.url}</a>
                            {/if}
                        </li>
                    {/each}
                </ul>
            </details>
        {/if}
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

    .avatar-spacer {
        width: 32px;
        height: 32px;
    }

    .sources {
        margin-top: 0.75rem;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        padding-top: 0.5rem;
    }

    .sources summary {
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
        color: #111827;
    }

    .sources ul {
        list-style: none;
        padding-left: 0;
        margin: 0.5rem 0 0;
        display: grid;
        gap: 0.4rem;
    }

    .sources li {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
    }

    .source-type {
        font-weight: 700;
        text-transform: uppercase;
        font-size: 0.65rem;
        letter-spacing: 0.05em;
        padding: 0.15rem 0.35rem;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.1);
        color: #111827;
    }

    .source-label {
        font-weight: 600;
    }

    .source-link {
        color: #1d4ed8;
        text-decoration: underline;
        word-break: break-all;
    }
</style>
