<script>
    /**
     * @typedef {Object} DocLink
     * @property {string} title
     * @property {string} href
     * @property {string[]=} keywords
     * @property {boolean=} external
     * @property {string[]=} features
     * @property {string=} bodyText
     */

    /**
     * @typedef {Object} DocsSection
     * @property {string} title
     * @property {DocLink[]} links
     */

    import { findDocSnippet, parseDocsQuery } from '../../lib/docs/fullTextSearch';

    /** @type {DocsSection[]} */
    export let sections = [];
    /** @type {() => Promise<Record<string, string>>} */
    export let loadFullTextCorpus = async () => {
        const response = await fetch('/docs/full-text-corpus.json');

        if (!response.ok) {
            throw new Error(`Failed to load docs full-text corpus (${response.status})`);
        }

        return response.json();
    };

    let query = '';
    /** @type {Record<string, string> | null} */
    let fullTextCorpus = null;
    let fullTextCorpusPromise = null;
    let isLoadingFullTextCorpus = false;
    let filteredSections = [];

    const normalize = (value) => value.toLowerCase().trim();

    // Note: `keywords` may be an empty array for operator-only queries (e.g. "has:link").
    // In that case, `every()` returns `true` by design, so word matching does not filter out
    // results.
    const matchesWords = (terms, values) =>
        terms.every((term) => values.some((value) => value.includes(term)));

    const matchesOperators = (operators, features = []) => {
        if (!operators.length) {
            return true;
        }

        const normalizedFeatures = features.map(normalize);
        return operators.every((operator) => normalizedFeatures.includes(operator));
    };

    const ensureFullTextCorpus = async () => {
        if (fullTextCorpus) {
            return fullTextCorpus;
        }

        if (!fullTextCorpusPromise) {
            isLoadingFullTextCorpus = true;
            fullTextCorpusPromise = loadFullTextCorpus()
                .then((corpus) => {
                    fullTextCorpus = corpus ?? {};
                    return fullTextCorpus;
                })
                .catch((error) => {
                    console.error('Failed to load docs full-text corpus', error);
                    fullTextCorpus = {};
                    return fullTextCorpus;
                })
                .finally(() => {
                    isLoadingFullTextCorpus = false;
                });
        }

        return fullTextCorpusPromise;
    };

    const getBodyText = (link, corpus = fullTextCorpus) => {
        if (typeof link.bodyText === 'string') {
            return link.bodyText;
        }

        if (!corpus) {
            return '';
        }

        return corpus[normalize(link.href ?? '')] ?? '';
    };

    const matchLink = (link, parsedQuery, corpus = fullTextCorpus) => {
        if (!parsedQuery.operators.length && !parsedQuery.keywords.length) {
            return true;
        }

        const searchableValues = [link.title, ...(link.keywords ?? []), getBodyText(link, corpus)].map(normalize);

        return (
            matchesWords(parsedQuery.keywords, searchableValues) &&
            matchesOperators(parsedQuery.operators, link.features)
        );
    };

    $: parsedQuery = parseDocsQuery(query);
    $: if (parsedQuery.keywords.length > 0) {
        void ensureFullTextCorpus();
    }
    $: {
        const corpus = fullTextCorpus;

        filteredSections = sections
            .map((section) => ({
                title: section.title,
                links: section.links
                    .filter((link) => matchLink(link, parsedQuery, corpus))
                    .map((link) => ({
                        ...link,
                        snippet:
                            parsedQuery.keywords.length && !parsedQuery.isHasPredicate
                                ? findDocSnippet(
                                      {
                                          ...link,
                                          bodyText: getBodyText(link, corpus),
                                      },
                                      parsedQuery.keywords
                                  )
                                : null,
                    })),
            }))
            .filter((section) => section.links.length > 0);
    }

    $: totalResults = filteredSections.reduce((count, section) => count + section.links.length, 0);
</script>

<div class="docs-index">
    <label class="sr-only" for="docs-search-input">Search docs</label>
    <input
        id="docs-search-input"
        type="search"
        bind:value={query}
        placeholder="Search docs"
        aria-label="Search docs"
    />

    {#if parsedQuery.keywords.length > 0 && isLoadingFullTextCorpus}
        <p class="empty-state">Loading docs index…</p>
    {:else if parsedQuery.normalized && totalResults === 0}
        <p class="empty-state">No docs found for "{query}".</p>
    {:else}
        <div class="docs-grid" data-testid="docs-grid">
            {#each parsedQuery.normalized ? filteredSections : sections as section}
                <section class="docs-section">
                    <h2>{section.title}</h2>
                    <nav aria-label={`Docs ${section.title}`}>
                        {#each section.links as link}
                            <div class="doc-link">
                                <a
                                    href={link.href}
                                    rel={link.external ? 'noopener noreferrer' : undefined}
                                    target={link.external ? '_blank' : undefined}
                                >
                                    {link.title}
                                </a>
                                {#if link.snippet}
                                    <p class="doc-snippet" title={link.snippet.snippetText}>
                                        {@html link.snippet.snippetHtml}
                                    </p>
                                {/if}
                            </div>
                        {/each}
                    </nav>
                </section>
            {/each}
        </div>
    {/if}
</div>

<style>
    .docs-index {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        align-items: center;
        width: 100%;
    }

    input {
        width: 100%;
        max-width: 28rem;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.35);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
    }

    input::placeholder {
        color: rgba(255, 255, 255, 0.75);
    }

    .docs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        gap: 1.5rem;
        width: 100%;
    }

    .docs-section {
        background-color: #2f5b2f;
        border-radius: 2rem;
        padding: 1.25rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    h2 {
        color: white;
        margin: 0;
    }

    nav {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        justify-items: center;
        gap: 0.75rem;
    }

    .doc-link {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        align-items: center;
        text-align: center;
        min-width: 0;
        max-width: 100%;
        justify-self: center;
    }

    a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.625rem 1rem;
        background-color: #84d484;
        border-radius: 999px;
        color: black;
        text-decoration: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        opacity: 0.85;
        transition: opacity 0.2s ease-in-out;
        min-width: 0;
        max-width: 100%;
    }

    .doc-snippet {
        margin: 0;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.9);
        min-width: 0;
        max-width: 100%;
        align-self: stretch;
        /* Keep both for cross-browser long-token wrapping support. */
        overflow-wrap: anywhere;
        word-break: break-word;
        white-space: normal;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
    }

    :global(.doc-snippet *) {
        /* Ensure highlighted tokens wrap even inside inline elements rendered via @html. */
        overflow-wrap: anywhere;
        word-break: break-word;
        white-space: normal;
    }

    :global(.doc-snippet strong) {
        font-weight: 700;
        color: #ffffff;
    }

    a:hover,
    a:focus {
        opacity: 1;
    }

    .empty-state {
        background-color: #2f5b2f;
        border-radius: 2rem;
        padding: 1.5rem;
        color: white;
        text-align: center;
        width: 100%;
        max-width: 32rem;
    }

    .sr-only {
        border: 0;
        clip: rect(0 0 0 0);
        height: 1px;
        width: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        position: absolute;
    }
</style>
