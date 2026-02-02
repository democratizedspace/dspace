<script>
    import { onDestroy, onMount, tick } from 'svelte';
    import {
        defaultOpenAIErrorMessage,
        describeOpenAIError,
        buildChatPrompt,
        CHAT_PROMPT_VERSION,
        resolveAppGitSha,
        getOpenAIErrorSummary,
        GPT5ChatV2,
    } from '../../../utils/openAI.js';
    import { writable } from 'svelte/store';
    import {
        messages,
        countTokens,
        personaOptions,
        activePersona,
        activePersonaId,
        setActivePersona,
    } from '../../../stores/chat.js';
    import {
        loadGameState,
        ready,
        state as gameStateStore,
    } from '../../../utils/gameState/common.js';
    import { normalizeSettings } from '../../../utils/settingsDefaults.js';
    import {
        SAVE_SNAPSHOT_HINT_TEXT,
        shouldShowSaveSnapshotHint,
    } from '../../../utils/chatHints.js';
    import { getDocsRagMeta, getDocsRagComparison } from '../../../utils/docsRag.js';
    import Message from './Message.svelte';
    import Spinner from '../../../components/svelte/Spinner.svelte';

    const message = writable('');
    const messageHistory = writable([]);
    const saveSnapshotHintStorageKey = 'dspace.chat.dismissSaveSnapshotHint';
    let showSpinner = false;
    let hydrated = false;
    let messageCounter = 0;
    let errorBanner = null;
    let showDebug = false;
    let debugMessages = [];
    let debugExpanded = false;
    let settingsUnsubscribe;
    let saveSnapshotHintDismissed = false;
    let saveSnapshotHintFocusListener;
    let appGitSha = 'unknown';
    let docsRagGitSha = 'unknown';
    let docsRagGeneratedAt = 'unknown';
    let docsRagComparisonMessage = 'App build SHA unavailable; cannot compare.';
    let docsRagWarning = null;

    $: currentPersona = $activePersona;
    $: personaSummary = currentPersona?.summary;
    $: showSaveSnapshotHint = !saveSnapshotHintDismissed && shouldShowSaveSnapshotHint($message);

    function getWelcomeText(persona) {
        return persona?.welcomeMessage ?? persona?.welcomeSnippet ?? '';
    }

    function getPersonaAvatar(persona) {
        return persona?.avatar ?? null;
    }

    function getPersonaAlt(persona) {
        return persona?.name ? `${persona.name} portrait` : 'NPC portrait';
    }

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

    function addWelcomeMessage(persona = currentPersona) {
        const welcomeText = getWelcomeText(persona);
        if (!welcomeText) {
            return;
        }
        const welcome = {
            role: 'assistant',
            content: welcomeText,
            tokens: countTokens(welcomeText),
            avatarUrl: getPersonaAvatar(persona),
            avatarAlt: getPersonaAlt(persona),
            timestamp: Date.now(),
        };
        addMessage(welcome);
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
        let debugPayload;
        if (showDebug) {
            debugPayload = await buildChatPrompt(historyForApi, {
                persona: currentPersona,
            });
            debugMessages = debugPayload.debugMessages;
        } else {
            debugMessages = [];
        }

        try {
            const aiResponse = await GPT5ChatV2(historyForApi, {
                persona: currentPersona,
                promptPayload: debugPayload,
            });
            const responseText = aiResponse?.text ?? '';
            const aiMessage = {
                role: 'assistant',
                content: responseText,
                tokens: countTokens(responseText),
                avatarUrl: getPersonaAvatar(currentPersona),
                avatarAlt: getPersonaAlt(currentPersona),
                timestamp: Date.now(),
                contextSources: aiResponse?.contextSources ?? [],
            };

            addMessage(aiMessage);
        } catch (error) {
            console.error('OpenAI chat request failed', error);
            errorBanner = getOpenAIErrorSummary(error);
            const fallback = describeOpenAIError(error) || defaultOpenAIErrorMessage;
            addMessage({
                role: 'assistant',
                content: fallback,
                tokens: countTokens(fallback),
                avatarUrl: getPersonaAvatar(currentPersona),
                avatarAlt: getPersonaAlt(currentPersona),
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

    function dismissSaveSnapshotHint() {
        saveSnapshotHintDismissed = true;
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(saveSnapshotHintStorageKey, '1');
        }
    }

    function syncSaveSnapshotHintDismissed() {
        if (typeof sessionStorage === 'undefined') {
            return;
        }
        saveSnapshotHintDismissed = sessionStorage.getItem(saveSnapshotHintStorageKey) === '1';
    }

    async function handlePersonaChange(event) {
        const selectedId = event.target.value;
        const nextPersona =
            personaOptions.find((option) => option.id === selectedId) || currentPersona;

        setActivePersona(selectedId);
        messageHistory.set([]);
        messages.set([]);
        showSpinner = false;
        errorBanner = null;
        message.set('');
        await tick();
        addWelcomeMessage(nextPersona);
    }

    onMount(async () => {
        hydrated = true;
        await ready;
        const currentState = loadGameState();
        const normalized = normalizeSettings(currentState?.settings);
        showDebug = normalized.showChatDebugPayload;
        appGitSha = resolveAppGitSha();
        const docsMeta = await getDocsRagMeta();
        docsRagGitSha = docsMeta?.gitSha ?? 'unknown';
        docsRagGeneratedAt = docsMeta?.generatedAt ?? 'unknown';
        const comparison = getDocsRagComparison(appGitSha, docsRagGitSha);
        docsRagComparisonMessage = comparison.message;
        docsRagWarning = comparison.status === 'stale' ? comparison.message : null;
        syncSaveSnapshotHintDismissed();
        saveSnapshotHintFocusListener = () => syncSaveSnapshotHintDismissed();
        window.addEventListener('focus', saveSnapshotHintFocusListener);
        settingsUnsubscribe = gameStateStore.subscribe((value) => {
            const nextNormalized = normalizeSettings(value?.settings);
            showDebug = nextNormalized.showChatDebugPayload;
            if (!showDebug) {
                debugExpanded = false;
                debugMessages = [];
            }
        });
        if ($messageHistory.length === 0) {
            addWelcomeMessage();
        }
    });

    onDestroy(() => {
        settingsUnsubscribe?.();
        if (saveSnapshotHintFocusListener) {
            window.removeEventListener('focus', saveSnapshotHintFocusListener);
        }
    });
</script>

<div
    class="chat"
    data-testid="chat-panel"
    data-provider="openai"
    data-hydrated={hydrated ? 'true' : 'false'}
>
    {#if errorBanner}
        <div class="chat-error" role="alert" data-error-type={errorBanner.type}>
            {errorBanner.message}
        </div>
    {/if}
    <div class="persona-selector">
        <label for="chat-persona">Talk to</label>
        <select id="chat-persona" bind:value={$activePersonaId} on:change={handlePersonaChange}>
            {#each personaOptions as persona}
                <option value={persona.id}>{persona.name}</option>
            {/each}
        </select>
        {#if currentPersona?.avatar || personaSummary}
            <div class="persona-details">
                {#if currentPersona?.avatar}
                    <img src={currentPersona.avatar} alt={getPersonaAlt(currentPersona)} />
                {/if}
                {#if personaSummary}
                    <p class="persona-summary">{personaSummary}</p>
                {/if}
            </div>
        {/if}
    </div>

    <div class="vertical">
        <textarea
            class="message-textarea"
            bind:value={$message}
            on:keydown={handleKeyDown}
            style="font-size: 18px;"
        ></textarea>
        {#if showSaveSnapshotHint}
            <div class="save-snapshot-hint" role="note">
                <span>{SAVE_SNAPSHOT_HINT_TEXT}</span>
                <button
                    type="button"
                    class="hint-dismiss"
                    aria-label="Dismiss save snapshot hint"
                    on:click={dismissSaveSnapshotHint}
                >
                    ×
                </button>
            </div>
        {/if}
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
                    contextSources={message.contextSources}
                />
            {/each}
        {/if}
    </div>

    {#if showDebug}
        <div class="debug-panel" data-testid="chat-debug-panel">
            <div class="debug-heading">
                <div>
                    <h3>Chat prompt debug</h3>
                    <p>Displays the full prompt payload, with RAG content highlighted.</p>
                    <p class="debug-version">Prompt version: {CHAT_PROMPT_VERSION}</p>
                </div>
                <button
                    class="debug-toggle"
                    type="button"
                    on:click={() => {
                        debugExpanded = !debugExpanded;
                    }}
                >
                    {debugExpanded ? 'Hide prompt' : 'Show prompt'}
                </button>
            </div>
            <div class="debug-metadata">
                <div class="debug-meta-row">
                    <span>App build SHA</span>
                    <span class="debug-mono">{appGitSha}</span>
                </div>
                <div class="debug-meta-row">
                    <span>Docs RAG SHA</span>
                    <span class="debug-mono">{docsRagGitSha}</span>
                </div>
                <div class="debug-meta-row">
                    <span>Docs RAG generatedAt</span>
                    <span class="debug-mono">{docsRagGeneratedAt}</span>
                </div>
                <div class="debug-meta-row">
                    <span>Docs RAG comparison</span>
                    <span class="debug-mono">{docsRagComparisonMessage}</span>
                </div>
            </div>
            {#if docsRagWarning}
                <div class="debug-warning" role="alert" aria-live="polite">{docsRagWarning}</div>
            {/if}
            {#if debugExpanded}
                {#if debugMessages.length}
                    <div class="debug-list">
                        {#each debugMessages as debugMessage, index (index)}
                            <div
                                class="debug-message"
                                class:rag={debugMessage.kind === 'rag'}
                                class:main={debugMessage.kind === 'main'}
                                data-testid="chat-debug-message"
                                data-kind={debugMessage.kind}
                            >
                                <div class="debug-meta">
                                    <span class="debug-role">{debugMessage.role}</span>
                                    <span class="debug-kind">
                                        {debugMessage.kind === 'rag' ? 'RAG' : 'Main'}
                                    </span>
                                </div>
                                <pre>{debugMessage.content}</pre>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="debug-empty">Send a message to view the prompt payload.</p>
                {/if}
            {/if}
        </div>
    {/if}
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

    .persona-details {
        display: flex;
        align-items: center;
        gap: 1rem;
        width: 100%;
        justify-content: center;
        flex-wrap: wrap;
    }

    .persona-details img {
        width: min(128px, 40vw);
        height: min(128px, 40vw);
        object-fit: cover;
        border-radius: 0.75rem;
        flex-shrink: 0;
    }

    .persona-summary {
        margin: 0;
        font-size: 0.9rem;
        text-align: left;
        color: rgba(0, 0, 0, 0.8);
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

    .save-snapshot-hint {
        width: 100%;
        margin-top: 0.25rem;
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        background: rgba(148, 163, 184, 0.12);
        color: rgba(15, 23, 42, 0.9);
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
    }

    .save-snapshot-hint span {
        flex: 1;
    }

    .hint-dismiss {
        height: 28px;
        width: 28px;
        margin: 0;
        padding: 0;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.08);
        color: rgba(15, 23, 42, 0.8);
        font-size: 1.1rem;
        line-height: 1;
    }

    .hint-dismiss:hover {
        background: rgba(15, 23, 42, 0.18);
    }

    .debug-panel {
        width: 100%;
        background: #0f172a;
        color: #e2e8f0;
        border-radius: 12px;
        padding: 1rem;
        border: 1px solid rgba(148, 163, 184, 0.4);
        display: grid;
        gap: 0.75rem;
    }

    .debug-heading {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.75rem;
    }

    .debug-heading h3 {
        margin: 0;
        font-size: 1.05rem;
    }

    .debug-heading p {
        margin: 0;
        font-size: 0.9rem;
        color: #cbd5e1;
    }

    .debug-metadata {
        display: grid;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: #cbd5e1;
    }

    .debug-meta-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .debug-mono {
        font-family:
            'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New',
            monospace;
        color: #f8fafc;
        word-break: break-all;
    }

    .debug-warning {
        padding: 0.6rem 0.75rem;
        border-radius: 0.65rem;
        border: 1px solid rgba(248, 113, 113, 0.7);
        background: rgba(127, 29, 29, 0.4);
        color: #fecaca;
        font-size: 0.9rem;
    }

    .debug-version {
        margin: 0;
        font-size: 0.85rem;
        color: #94a3b8;
    }

    .debug-toggle {
        height: 32px;
        margin: 0;
        padding: 0 0.75rem;
        font-size: 0.85rem;
        background: #1e293b;
        border: 1px solid rgba(148, 163, 184, 0.5);
        border-radius: 999px;
        color: #e2e8f0;
    }

    .debug-toggle:hover {
        background: #334155;
    }

    .debug-list {
        display: grid;
        gap: 0.75rem;
    }

    .debug-message {
        border-radius: 10px;
        padding: 0.75rem;
        display: grid;
        gap: 0.5rem;
        border: 1px solid transparent;
    }

    .debug-message.rag {
        background: rgba(250, 204, 21, 0.18);
        border-color: rgba(250, 204, 21, 0.45);
    }

    .debug-message.main {
        background: rgba(59, 130, 246, 0.18);
        border-color: rgba(59, 130, 246, 0.45);
    }

    .debug-meta {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #e2e8f0;
        opacity: 0.85;
    }

    .debug-meta span {
        display: inline-flex;
        gap: 0.25rem;
    }

    .debug-message pre {
        margin: 0;
        font-family:
            'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New',
            monospace;
        font-size: 0.85rem;
        white-space: pre-wrap;
        word-break: break-word;
    }

    .debug-empty {
        margin: 0;
        font-size: 0.9rem;
        color: #cbd5e1;
    }
</style>
