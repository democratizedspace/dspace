<script>
  import { onMount } from 'svelte';
  import DOMPurify from 'dompurify';
  import hljs from 'highlight.js';
  import 'highlight.js/styles/default.css';
  import { Remarkable } from 'remarkable';
  import { formatRelative, format } from 'date-fns';
  import { fade } from 'svelte/transition';

  export let messageMarkdown;
  export let className;
  export let timestamp;

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

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    let language = token.info ? token.info.trim() : '';
    language = languageMapping[language] ? languageMapping[language] : language;
    const code = token.content.trim();
    const languageLabel = language ? `<span class="language-label">${language}</span>` : '';

    return `<div>${languageLabel}<pre title="${language}"><code class="hljs ${language}">${hljs.highlightAuto(code).value}</code><button class="copy-button">Copy</button></pre></div>`;
  };

  $: {
    let rawHtml = md.render(messageMarkdown);
    messageHtml = DOMPurify.sanitize(rawHtml);
  }

  let toastVisible = false;

  function copyToClipboard(event) {
    if (event.target.classList.contains('copy-button')) {
      const pre = event.target.parentNode;
      const code = pre.querySelector('code').innerText;
      navigator.clipboard.writeText(code);
      toastVisible = true;
      setTimeout(() => { toastVisible = false; }, 3000);
    }
  }

  onMount(() => {
    const copyButtons = document.querySelectorAll('.copy-button');
    copyButtons.forEach((button) => {
      button.addEventListener('click', copyToClipboard);
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
        button.removeEventListener('click', copyToClipboard);
      });
    };
  });
</script>

<div class={className}>
  <div class="timestamp" title={format(new Date(timestamp), "PPpp")}>
    {formatRelative(new Date(timestamp), new Date())}
  </div>
  {@html messageHtml}
  {#if toastVisible}
    <div class="toast" transition:fade={{ delay: 2000, duration: 1000 }}>Copied to clipboard</div>
  {/if}
</div>

<style>
  .user,
  .assistant {
      padding: 10px;
      font-size: 16px;
      border-radius: 5px;
      box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
      margin-bottom: 10px;
      max-width: 80%;
      color: white;
  }

  .user {
      align-self: flex-end;
      background-color: #007006;
  }

  .assistant .timestamp {
      color: #4d4d4d;
  }

  .user .timestamp {
      color: #f0f0f0;
  }

  .assistant {
      align-self: flex-start;
      background-color: #dddddd;
      color: black;
  }

  .timestamp {
      font-size: 12px;
      margin-bottom: 5px;
  }

  pre code {
      display: block;
      overflow-x: auto;
      padding: 0.5em;
      background-color: #2b2b2b;
      color: #f8f8f8;
      border-radius: 5px;
      width: calc(100% - 50px);
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
 
